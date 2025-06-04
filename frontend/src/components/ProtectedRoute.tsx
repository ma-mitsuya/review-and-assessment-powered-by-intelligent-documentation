import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { Authenticator } from "@aws-amplify/ui-react";
import { useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { HiTranslate } from "react-icons/hi";
import { I18n } from "aws-amplify/utils";
import { translations } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "../../ThemeAuth.css";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === "ja" ? "en" : "ja";
    changeLanguage(newLang);
  };

  // Set Amplify UI language based on the current app language
  useEffect(() => {
    I18n.putVocabularies(translations);
    I18n.setLanguage(language);
  }, [language]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        {/* Language switcher */}
        <button
          onClick={toggleLanguage}
          className="bg-gray-100 hover:bg-gray-200 absolute right-4 top-4 flex items-center rounded-md px-3 py-1 text-sm transition-colors"
          style={{ zIndex: 1000 }}>
          <HiTranslate className="mr-2 h-4 w-4" />
          {language === "ja" ? "English" : "日本語"}
        </button>

        <div className="auth-header">
          <img
            src="/src/assets/icon.png"
            alt="RAPID Icon"
            className="auth-icon"
          />
          <h2 className="auth-title">{t("common.appName")}</h2>
          <p className="auth-description">{t("auth.appDescription")}</p>
        </div>
        <div className="auth-wrapper">
          <Authenticator
            initialState="signIn"
            loginMechanisms={["username"]}
            components={{
              SignIn: {
                Header() {
                  return (
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        textAlign: "center",
                      }}></h3>
                  );
                },
              },
              SignUp: {
                Header() {
                  return (
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        textAlign: "center",
                      }}></h3>
                  );
                },
              },
            }}>
            {/* Ignore the destructured props since we don't use them */}
            {(_) => {
              // Automatically redirect on successful authentication
              window.location.href = "/";
              return <div></div>;
            }}
          </Authenticator>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
