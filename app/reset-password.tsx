import React from "react";
import ForgotPassword from "@/src/components/views/ForgotPassword";
import FormLayout from "@/src/components/blocks/Layout/FormLayout";
import SignUp from "@/src/components/views/signUp";
import ResetPassword from "@/src/components/views/resetPassword";

export default function App() {
    return <FormLayout>
        <ResetPassword />
    </FormLayout>;
}
