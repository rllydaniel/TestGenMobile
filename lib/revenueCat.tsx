import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  LOG_LEVEL,
} from 'react-native-purchases';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const RC_API_KEY = 'test_rZZzsDodhbYcMzLefAoxBQHsdCs';
const ENTITLEMENT_ID = 'TestGen Pro';

interface RevenueCatContextValue {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  isProEntitled: boolean;
  isLoading: boolean;
  restorePurchases: () => Promise<CustomerInfo | null>;
}

const RevenueCatContext = createContext<RevenueCatContextValue>({
  customerInfo: null,
  offerings: null,
  isProEntitled: false,
  isLoading: true,
  restorePurchases: async () => null,
});

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configuredRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Configure SDK once
  useEffect(() => {
    if (configuredRef.current) return;
    configuredRef.current = true;

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey: RC_API_KEY });
    console.log('[RevenueCat] SDK configured');
  }, []);

  // Identify/logout user when auth changes
  useEffect(() => {
    if (!configuredRef.current) return;

    const identify = async () => {
      try {
        if (user?.id && user.id !== lastUserIdRef.current) {
          lastUserIdRef.current = user.id;
          const { customerInfo: info } = await Purchases.logIn(user.id);
          setCustomerInfo(info);
          console.log('[RevenueCat] Logged in as', user.id);
        } else if (!user && lastUserIdRef.current) {
          lastUserIdRef.current = null;
          const info = await Purchases.logOut();
          setCustomerInfo(info);
          console.log('[RevenueCat] Logged out');
        }
      } catch (err) {
        console.warn('[RevenueCat] Identity error:', err);
      }
    };

    identify();
  }, [user?.id]);

  // Fetch initial customer info and offerings
  useEffect(() => {
    if (!configuredRef.current) return;

    const fetchInitial = async () => {
      try {
        const [info, offs] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        setCustomerInfo(info);
        setOfferings(offs);
      } catch (err) {
        console.warn('[RevenueCat] Initial fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, []);

  // Listen for customer info updates
  useEffect(() => {
    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  // Sync entitlement to Supabase when it changes
  const isProEntitled = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;

  useEffect(() => {
    if (!user?.id || customerInfo === null) return;

    const newTier = isProEntitled ? 'premium' : 'free';

    supabase
      .from('profiles')
      .update({ subscription_tier: newTier })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.warn('[RevenueCat] Sync tier error:', error.message);
        else console.log('[RevenueCat] Synced tier to DB:', newTier);
      });
  }, [isProEntitled, user?.id]);

  const restorePurchases = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info;
    } catch (err) {
      console.warn('[RevenueCat] Restore error:', err);
      return null;
    }
  }, []);

  return (
    <RevenueCatContext.Provider
      value={{
        customerInfo,
        offerings,
        isProEntitled,
        isLoading,
        restorePurchases,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error('useRevenueCat must be used within RevenueCatProvider');
  return ctx;
}

export { ENTITLEMENT_ID };
