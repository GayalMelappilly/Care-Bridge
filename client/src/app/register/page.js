"use client";
import React, { useState } from "react";
import { registerUser } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

const Register = () => {
    const [inputs, setInputs] = useState({
        email: "",
        password: "",
        name: "",
        role: "parent",
        specialty: "",
        credentials: "",
        bio: ""
    });
    const [error, setError] = useState("");
    const { login } = useAuth();

    const { email, password, name, role, specialty, credentials, bio } = inputs;

    const onChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    const onSubmitForm = async (e) => {
        e.preventDefault();
        try {
            const body = { email, password, name, role, specialty, credentials, bio };
            const data = await registerUser(body);

            if (data.token) {
                login(data.token, data.user);
            } else {
                // Usually registerUser throws if not ok, but just in case
            }
        } catch (err) {
            console.error(err.message);
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Register for CareBridge
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={onSubmitForm}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                required
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
                                className="relative block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                className="relative block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Password"
                            />
                        </div>
                        <div>
                            <select
                                name="role"
                                value={role}
                                onChange={onChange}
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                            >
                                <option value="parent">Parent/Caregiver</option>
                                <option value="mentor">Mentor</option>
                            </select>
                        </div>
                    </div>

                    {role === "mentor" && (
                        <div className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    name="specialty"
                                    value={specialty}
                                    onChange={onChange}
                                    className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="Specialty (e.g. Occupational Therapist)"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    name="credentials"
                                    value={credentials}
                                    onChange={onChange}
                                    className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="Credentials (e.g. OTR/L, BCBA)"
                                />
                            </div>
                            <div>
                                <textarea
                                    name="bio"
                                    value={bio}
                                    onChange={onChange}
                                    rows="3"
                                    className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="Short bio"
                                />
                            </div>
                        </div>
                    )}

                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Register
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm">
                    <p>
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
