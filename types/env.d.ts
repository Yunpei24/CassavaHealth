declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_API_KEY: string;
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_SUPABASE_MODE: 'cloud' | 'self-hosted';
      EXPO_PUBLIC_SUPABASE_SELF_HOSTED_URL?: string;
      EXPO_PUBLIC_SUPABASE_SELF_HOSTED_ANON_KEY?: string;
    }
  }
}

export {};