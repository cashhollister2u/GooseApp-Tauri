import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from '../context/AuthContext'
import {NextUIProvider} from "@nextui-org/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <NextUIProvider>
      <div className="bg-black min-h-screen">
      <Component {...pageProps} />
      </div>
      </NextUIProvider>
    </AuthProvider>
  )
}