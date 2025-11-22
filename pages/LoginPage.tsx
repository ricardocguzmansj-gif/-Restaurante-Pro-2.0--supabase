
import React, { useState } from 'react';
import { Pizza, Loader2, Eye, EyeOff, X, Mail, ArrowRight, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { recoverPassword } = useAppContext();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [tempPassword, setTempPassword] = useState<string | null>(null); // Stored for demo display

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        
        setIsLoading(true);
        setErrorMessage(null);
        
        try {
            const tempPass = await recoverPassword(email);
            setTempPassword(tempPass);
            setIsSent(true);
        } catch (error: any) {
            setErrorMessage(error.message || "Error al intentar recuperar la contraseña.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="h-5 w-5" />
                </button>

                {!isSent ? (
                    <>
                        <div className="mb-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                                <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recuperar Contraseña</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Ingresa tu correo electrónico y te enviaremos una contraseña temporal para restablecer tu acceso.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email registrado
                                </label>
                                <input
                                    type="email"
                                    id="reset-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="ejemplo@restaurante.com"
                                    required
                                />
                            </div>
                            
                            {errorMessage && (
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                                {isLoading ? 'Procesando...' : 'Generar Contraseña Temporal'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-bounce">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">¡Contraseña Generada!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                            En un entorno de producción real, recibirías un correo con tu nueva contraseña.
                        </p>
                        
                        {tempPassword && (
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6 border border-gray-300 dark:border-gray-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Contraseña Temporal</p>
                                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-wider select-all">{tempPassword}</p>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                                    Copia esta contraseña para iniciar sesión y cámbiala inmediatamente.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Ir al inicio de sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const LoginPage: React.FC = () => {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);

    await login(email, password);
    setIsLoading(false);
  };

  const inputClasses = "block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="text-center">
            <div className="flex justify-center mb-4">
                <Pizza className="h-12 w-12 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido a Restaurante Pro</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Inicia sesión para continuar</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                <Database className="h-3 w-3" /> Modo Producción (Supabase)
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección de Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder="admin@restaurante.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClasses} pr-10`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <button 
                type="button" 
                onClick={() => setIsForgotModalOpen(true)}
                className="font-medium text-orange-600 hover:text-orange-500 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
      {isForgotModalOpen && <ForgotPasswordModal onClose={() => setIsForgotModalOpen(false)} />}
    </div>
  );
};
