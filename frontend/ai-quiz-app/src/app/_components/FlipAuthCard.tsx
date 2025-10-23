'use client';

import { useEffect, useState } from 'react';
import { cn } from "../_lib/utils";
import { useRouter } from 'next/navigation';
import { validateToken } from '../_lib/validateAuth';
import { appDB } from "../../lib/appDataDB";
import { jwtDecode } from 'jwt-decode';

export default function FlipAuthCard() {

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });

  const [registerFormData, setRegisterFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    console.log("FlipAuthCard mounted");
    const checkToken = async () => {
      console.log("Checking token validity at FlipAuthCard");
      const token = localStorage.getItem('token');
      if (token) {
        const isValid = await validateToken(token);
        if (isValid) {
          router.replace('/home');
        } else {
          localStorage.removeItem('token');
        }
      }
    };

    checkToken();
  }, [router]);

  const setUserDetailsDB = async ({id,name,email}:{id:string,name:string,email:string}) => {
    await appDB.setUserLogin({
      userId: id,
      name: name,
      email:email
    });
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid email or password");
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error("Login failed. Please try again.");
        }
      }
      localStorage.setItem('token', data.token);
      setUserDetailsDB(data.user);

      router.replace("/home");
    } catch (err: any) {
      setError(err.message || 'Something went wrong during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (registerFormData.password !== registerFormData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerFormData.email)) {
      setError('Please provide valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerFormData.name,
          email: registerFormData.email,
          password: registerFormData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setIsSuccess(true);
      setIsFlipped(false);
      setError("");

    } catch (err: any) {
      setError(err.message || 'Something went wrong during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 perspective-1000">
      <div
        className={cn(
          "relative w-80 h-[32rem] transition-transform duration-700 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-2xl p-6 border border-gray-200 flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h2>
            <p className="text-gray-600 mb-8 text-center">Continue your knowledge journey</p>
          </div>

          {isSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              Registration successful! Please login.
            </div>
          )}

          {error && !isFlipped && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="enter@gmail.com"
                value={loginFormData.email}
                onChange={(e) =>
                  setLoginFormData({ ...loginFormData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="••••••••"
                value={loginFormData.password}
                onChange={(e) =>
                  setLoginFormData({ ...loginFormData, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              onClick={handleLoginSubmit}
            >
              {isLoading ? "Loading the Aura..." : "Launch Quizora"}
            </button>

            <button
              onClick={() => {
                setIsFlipped(true);
                setError("");
                setIsSuccess(false);
              }}
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium transition-colors w-full text-center"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col justify-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Begin Journey</h2>
            <p className="text-gray-600 mb-4 text-sm text-center">Join the evolution of learning</p>
          </div>

          {error && isFlipped && (
            <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Alex Johnson"
                value={registerFormData.name}
                onChange={(e) =>
                  setRegisterFormData({ ...registerFormData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="enter@quizora.com"
                value={registerFormData.email}
                onChange={(e) =>
                  setRegisterFormData({ ...registerFormData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="••••••••"
                value={registerFormData.password}
                onChange={(e) =>
                  setRegisterFormData({ ...registerFormData, password: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="••••••••"
                value={registerFormData.confirmPassword}
                onChange={(e) =>
                  setRegisterFormData({ ...registerFormData, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
              onClick={handleRegisterSubmit}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setError("");
              }}
              className="text-cyan-600 hover:text-cyan-700 text-xs font-medium transition-colors w-full text-center"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}