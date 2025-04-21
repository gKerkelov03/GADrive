import { useUser } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InputField from "@/components/InputField";
import { icons } from "@/constants";
import { fetchAPI, useFetch } from "@/lib/fetch";

interface UserData {
  phone_number: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface FormTouched {
  firstName?: boolean;
  lastName?: boolean;
  email?: boolean;
  phone?: boolean;
}

const Profile = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});

  const {
    data: userData,
    loading,
    error,
    refetch,
  } = useFetch<UserData>(`/(api)/user/${user?.id}`);

  useEffect(() => {
    if (userData?.phone_number) {
      setEditedData((prev) => ({
        ...prev,
        phone: userData.phone_number,
      }));
    }
  }, [userData]);

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
      const digitsOnly = value.replace(/\D/g, "");

      if (!digitsOnly) {
        return "Phone number is required";
      }

      if (digitsOnly.length < 6) {
        return "Please enter a valid phone number";
      }

      if (digitsOnly.length > 15) {
        return "Phone number is too long";
      }
    }
    return undefined;
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, editedData[field]);
    if (error) {
      setErrors({ ...errors, [field]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(editedData).forEach((key) => {
      const error = validateField(
        key as keyof FormErrors,
        editedData[key as keyof typeof editedData]
      );
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors before saving.");
      return;
    }

    setIsSaving(true);

    try {
      if (user) {
        await user.update({
          firstName: editedData.firstName,
          lastName: editedData.lastName,
        });

        if (editedData.email !== user.primaryEmailAddress?.emailAddress) {
          const newEmail = await user.createEmailAddress({
            email: editedData.email,
          });
          await user.update({ primaryEmailAddressId: newEmail.id });
        }
      }

      const response = await fetchAPI(`/(api)/user/${user?.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: editedData.firstName,
          last_name: editedData.lastName,
          email: editedData.email,
          phone_number: editedData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user in database");
      }

      await refetch();

      Alert.alert("Success", "Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      Alert.alert("Error", err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex flex-row justify-between items-center my-5">
          <Text className="text-2xl font-JakartaBold">Моят профил</Text>
          <TouchableOpacity
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="bg-neutral-100 p-2 rounded-full"
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <MaterialIcons
                name={isEditing ? "check" : "edit"}
                size={24}
                color="#6B7280"
              />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex items-center justify-center my-5">
          <Image
            source={{
              uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
            }}
            style={{ width: 110, height: 110, borderRadius: 110 / 2 }}
            className="rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300"
          />
        </View>

        <View className="flex flex-col items-start justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-3">
          <View className="flex flex-col items-start justify-start w-full">
            <InputField
              label="Име"
              placeholder={user?.firstName || "Не е намерено"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={isEditing}
              value={editedData.firstName}
              onChangeText={(text) =>
                setEditedData((prev) => ({ ...prev, firstName: text }))
              }
              onBlur={() => handleBlur("firstName")}
              icon={icons.person}
              error={touched.firstName ? errors.firstName : undefined}
            />

            <InputField
              label="Фамилия"
              placeholder={user?.lastName || "Не е намерено"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={isEditing}
              value={editedData.lastName}
              onChangeText={(text) =>
                setEditedData((prev) => ({ ...prev, lastName: text }))
              }
              onBlur={() => handleBlur("lastName")}
              icon={icons.person}
              error={touched.lastName ? errors.lastName : undefined}
            />

            <InputField
              label="Имейл"
              placeholder={
                user?.primaryEmailAddress?.emailAddress || "Не е намерено"
              }
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
              value={editedData.email}
              icon={icons.email}
            />

            <InputField
              label="Телефон"
              placeholder={userData?.phone_number || "Не е намерено"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={isEditing}
              value={editedData.phone}
              onChangeText={(text) =>
                setEditedData((prev) => ({ ...prev, phone: text }))
              }
              onBlur={() => handleBlur("phone")}
              icon={<MaterialIcons name="phone" size={24} color="#6B7280" />}
              error={touched.phone ? errors.phone : undefined}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
