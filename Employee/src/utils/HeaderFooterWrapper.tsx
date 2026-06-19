import { useLocation } from "react-router";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

const HeaderFooterWrapper = ({ children }: any) => {
  const { pathname } = useLocation();

  const authPagesPaths = ["/login", "/forgot-password", "/reset-password"];
  const isAuthPage = authPagesPaths.includes(pathname);

  return (
    <>
      {!isAuthPage && <Header />}
      <main className="flex-1 h-full">{children}</main>
      {!isAuthPage && <Footer />}
    </>
  );
};

export default HeaderFooterWrapper;
