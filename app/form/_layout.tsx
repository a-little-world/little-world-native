import FormLayout from "@/src/components/blocks/Layout/FormLayout";
import { Stack } from "expo-router";

export default () => {
  return (
    <FormLayout>
      <Stack>
        <Stack.Screen name="login" />
      </Stack>
    </FormLayout>
  );
};
