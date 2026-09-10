import { useEffect } from 'react';
import './App.css'
import AppRouting from './router/router'
import { attemptTokenRefreshOnLoad, getAccessToken } from './api/request'
import { getProfileApi } from './api/auth.api'
import { useAuthStore } from './store/store'

function App() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    async function init() {
      // Try to refresh the access token from the httpOnly cookie
      await attemptTokenRefreshOnLoad();

      const token = getAccessToken();

      if (token) {
        // Session is valid — fetch user profile from server
        // The user store is not persisted to localStorage, so we fetch fresh data
        try {
          const profileResp = await getProfileApi();
          if (profileResp.status && profileResp.data) {
            setUser({
              name: profileResp.data.name,
              nameAr: profileResp.data.nameAr,
              email: profileResp.data.email,
              image: profileResp.data.image,
              mobile: profileResp.data.mobile,
              ...profileResp.data,
            });
          }
        } catch {
          // Profile fetch failed — user will be redirected to login when accessing protected routes
        }
      }
    }

    init();
  }, [setUser]);

  return (
    <>
      <div className="font-just font-normal flex flex-col min-h-dvh scroll-smooth">
       <AppRouting />
      </div>
    </>
  )
}

export default App
