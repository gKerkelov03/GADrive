import { useSignIn } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";

interface FormErrors {
  email?: string;
  password?: string;
}

interface FormTouched {
  email?: boolean;
  password?: boolean;
}

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const validateField = (field: keyof FormErrors, value: string) => {
    if (field === "email") {
      if (!value.trim()) {
        return "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
    }
    if (field === "password") {
      if (!value) {
        return "Password is required";
      }
    }
    return undefined;
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, form[field]);
    if (error) {
      setErrors({ ...errors, [field]: error });
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(form).forEach((key) => {
      const error = validateField(
        key as keyof FormErrors,
        form[key as keyof typeof form]
      );
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    if (!validateForm()) {
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/home");
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      if (err.errors[0].code === "form_password_incorrect") {
        setErrors({ ...errors, password: "Incorrect password" });
      } else if (err.errors[0].code === "form_identifier_not_found") {
        setErrors({ ...errors, email: "Email not found" });
      } else {
        Alert.alert("Error", err.errors[0].longMessage);
      }
    }
  }, [isLoaded, form, errors]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Welcome 👋
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Имейл"
            placeholder="Въведете имейл"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => {
              setForm({ ...form, email: value });
              if (errors.email && touched.email) {
                const error = validateField("email", value);
                setErrors({ ...errors, email: error });
              }
            }}
            onBlur={() => handleBlur("email")}
            error={touched.email ? errors.email : undefined}
          />

          <InputField
            label="Парола"
            placeholder="Въведете парола"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => {
              setForm({ ...form, password: value });
              if (errors.password && touched.password) {
                const error = validateField("password", value);
                setErrors({ ...errors, password: error });
              }
            }}
            onBlur={() => handleBlur("password")}
            error={touched.password ? errors.password : undefined}
          />

          <CustomButton title="Вход" onPress={onSignInPress} className="mt-6" />

          <OAuth />

          <Link
            href="/sign-up"
            className="text-lg text-center text-general-200 mt-10"
          >
            Don't have an account?{" "}
            <Text className="text-primary-500">Регистрация</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
