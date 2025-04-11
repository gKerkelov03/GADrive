import React from "react";
import {
  TextInput,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";

import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  leftComponent,
  rightComponent,
  error,
  onBlur,
  ...props
}: InputFieldProps) => {
  const renderIcon = () => {
    if (!icon) return null;

    if (React.isValidElement(icon)) {
      return <View className={`ml-4 ${iconStyle}`}>{icon}</View>;
    }

    return (
      <View className={`ml-4 ${iconStyle}`}>
        <Image source={icon as any} className="w-6 h-6" />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          <Text className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}>
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border ${
              error ? "border-red-500" : "border-neutral-100"
            } focus:border-primary-500 ${containerStyle}`}
          >
            {renderIcon()}
            {leftComponent}
            <TextInput
              className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left`}
              secureTextEntry={secureTextEntry}
              onBlur={onBlur}
              {...props}
            />
            {rightComponent}
          </View>
          {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
