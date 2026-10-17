import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input, type InputProps } from "./input";

type FormInputProps<T extends FieldValues> = Omit<
  InputProps,
  "value" | "onChangeText"
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/**
 * Input bound to react-hook-form. Shows the field's validation error automatically;
 * `error` is a fallback for errors from outside the form (e.g. an API check).
 */
export function FormInput<T extends FieldValues>({
  control,
  name,
  onBlur,
  error,
  ...props
}: FormInputProps<T>) {
  const {
    field: { ref, value, onChange, onBlur: onFieldBlur },
    fieldState,
  } = useController({ control, name });

  return (
    <Input
      ref={ref}
      value={value ?? ""}
      onChangeText={onChange}
      onBlur={(event) => {
        onFieldBlur();
        onBlur?.(event);
      }}
      error={fieldState.error?.message ?? error}
      {...props}
    />
  );
}
