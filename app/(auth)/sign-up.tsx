import { useSignUp } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  LogBox,
} from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

// Suppress the defaultProps warning from CountryPicker
LogBox.ignoreLogs([
  "Support for defaultProps will be removed from function components",
]);

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

interface FormTouched {
  firstName?: boolean;
  lastName?: boolean;
  email?: boolean;
  phone?: boolean;
  password?: boolean;
}

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [country, setCountry] = useState<Country | null>(null);
  const [withCountryNameButton, setWithCountryNameButton] =
    useState<boolean>(false);
  const [withFlag] = useState<boolean>(true);
  const [withEmoji] = useState<boolean>(true);
  const [withFilter] = useState<boolean>(true);
  const [withAlphaFilter] = useState<boolean>(false);
  const [withCallingCode] = useState<boolean>(true);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const validateField = (field: keyof FormErrors, value: string) => {
    if (field === "firstName") {
      if (!value.trim()) {
        return "First name is required";
      } else if (value.length < 2) {
        return "First name must be at least 2 characters";
      }
    }
    if (field === "lastName") {
      if (!value.trim()) {
        return "Last name is required";
      } else if (value.length < 2) {
        return "Last name must be at least 2 characters";
      }
    }
    if (field === "email") {
      if (!value.trim()) {
        return "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
    }
    if (field === "phone") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");

      // Check if the number is empty
      if (!digitsOnly) {
        return "Phone number is required";
      }

      // Check if the number has at least 6 digits (minimum length for a valid phone number)
      if (digitsOnly.length < 6) {
        return "Please enter a valid phone number";
      }

      // Check if the number has more than 15 digits (maximum length for a phone number)
      if (digitsOnly.length > 15) {
        return "Phone number is too long";
      }
    }
    if (field === "password") {
      if (!value) {
        return "Password is required";
      } else if (value.length < 8) {
        return "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return "Password must contain uppercase, lowercase, and numbers";
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

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCountry(country);
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!validateForm()) {
      return;
    }

    try {
      // Create user in Clerk with only required fields
      const signUpResult = await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      // Update Clerk user profile with additional information
      await signUp.update({
        firstName: form.firstName,
        lastName: form.lastName,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      console.log("Attempting verification with code:", verification.code);

      // Complete email verification with Clerk
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      console.log(
        "Verification response:",
        JSON.stringify(completeSignUp, null, 2)
      );

      if (completeSignUp.status === "complete") {
        try {
          console.log("Creating database user with data:", {
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            phone: form.phone
              ? `+${country?.callingCode?.[0] || "1"}${form.phone}`
              : null,
            clerkId: completeSignUp.createdUserId,
          });

          // Create user in our database
          const response = await fetchAPI("/(api)/user", {
            method: "POST",
            body: JSON.stringify({
              first_name: form.firstName,
              last_name: form.lastName,
              email: form.email,
              phone: form.phone
                ? `+${country?.callingCode?.[0] || "1"}${form.phone}`
                : null,
              clerkId: completeSignUp.createdUserId,
            }),
          });

          const data = await response.json();
          console.log("Database response:", data);

          if (!response.ok) {
            throw new Error(data.error || "Failed to create user in database");
          }

          // Set the active session
          await setActive({ session: completeSignUp.createdSessionId });

          // Show success modal and redirect
          setVerification({
            ...verification,
            state: "success",
            error: "", // Clear any previous errors
          });
          setShowSuccessModal(true);
        } catch (err: any) {
          console.error("Error creating database user:", err);
          setVerification({
            ...verification,
            error: err.message || "Error creating user. Please try again.",
            state: "failed",
          });
        }
      } else {
        console.log("Verification status not complete:", completeSignUp.status);
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      console.error("Full verification error:", JSON.stringify(err, null, 2));
      setVerification({
        ...verification,
        error:
          err.errors?.[0]?.longMessage ||
          "Invalid verification code. Please try again.",
        state: "failed",
      });
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>
        <View className="p-5">
          <InputField
            label="Име *"
            placeholder="Въведете име"
            icon={icons.person}
            value={form.firstName}
            onChangeText={(value) => {
              setForm({ ...form, firstName: value });
              if (errors.firstName && touched.firstName) {
                const error = validateField("firstName", value);
                setErrors({ ...errors, firstName: error });
              }
            }}
            onBlur={() => handleBlur("firstName")}
            error={touched.firstName ? errors.firstName : undefined}
          />
          <InputField
            label="Фамилия *"
            placeholder="Въведете фамилия"
            icon={icons.person}
            value={form.lastName}
            onChangeText={(value) => {
              setForm({ ...form, lastName: value });
              if (errors.lastName && touched.lastName) {
                const error = validateField("lastName", value);
                setErrors({ ...errors, lastName: error });
              }
            }}
            onBlur={() => handleBlur("lastName")}
            error={touched.lastName ? errors.lastName : undefined}
          />
          <InputField
            label="Имейл *"
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
            label="Телефон *"
            placeholder="Въведете телефонен номер"
            icon={<MaterialIcons name="phone" size={24} color="#6B7280" />}
            textContentType="telephoneNumber"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(value) => {
              setForm({ ...form, phone: value });
              if (errors.phone && touched.phone) {
                const error = validateField("phone", value);
                setErrors({ ...errors, phone: error });
              }
            }}
            onBlur={() => handleBlur("phone")}
            error={touched.phone ? errors.phone : undefined}
            rightComponent={
              <TouchableOpacity
                onPress={() => setShowCountryPicker(true)}
                className="flex-row items-center ml-2"
              >
                <CountryPicker
                  theme={{
                    primaryColor: "#0286FF",
                    primaryColorVariant: "#0286FF",
                    backgroundColor: "#FFFFFF",
                    onBackgroundTextColor: "#000000",
                    fontSize: 14,
                  }}
                  containerButtonStyle={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  countryCode={countryCode}
                  withFilter={withFilter}
                  withFlag={withFlag}
                  withCountryNameButton={withCountryNameButton}
                  withAlphaFilter={withAlphaFilter}
                  withCallingCode={withCallingCode}
                  withEmoji={withEmoji}
                  onSelect={onSelect}
                  visible={showCountryPicker}
                  onClose={() => setShowCountryPicker(false)}
                />
                <Text className="ml-1 text-sm">
                  +{country?.callingCode?.[0] || "1"}
                </Text>
                <Image source={icons.arrowDown} className="w-4 h-4 ml-1" />
              </TouchableOpacity>
            }
          />
          <InputField
            label="Парола *"
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
          <CustomButton
            title="Регистрация"
            onPress={onSignUpPress}
            className="mt-6"
          />
          <OAuth />
          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            Already have an account?{" "}
            <Text className="text-primary-500">Вход</Text>
          </Link>
        </View>
        <ReactNativeModal
          isVisible={
            verification.state === "pending" || verification.state === "failed"
          }
          onModalHide={() => {
            if (verification.state === "success") {
              setShowSuccessModal(true);
            }
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="font-JakartaExtraBold text-2xl mb-2">
              Verification
            </Text>
            <Text className="font-Jakarta mb-5">
              We've sent a verification code to {form.email}.
            </Text>
            <InputField
              label={"Код"}
              icon={icons.lock}
              placeholder={"12345"}
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code) =>
                setVerification({ ...verification, code })
              }
            />
            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}
            <CustomButton
              title="Потвърди имейл"
              onPress={onPressVerify}
              className="mt-5 bg-success-500"
            />
          </View>
        </ReactNativeModal>
        <ReactNativeModal
          isVisible={showSuccessModal}
          onModalHide={() => {
            router.replace("/(root)/(tabs)/home");
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />
            <Text className="text-3xl font-JakartaBold text-center">
              Verified
            </Text>
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              You have successfully verified your account.
            </Text>
            <CustomButton
              title="Към началната страница"
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/(root)/(tabs)/home");
              }}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
