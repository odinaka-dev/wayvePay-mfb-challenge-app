import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Text, View } from "react-native";

import { Banner } from "@/components/shared/banner";
import { Button } from "@/components/shared/button";
import { FormInput } from "@/components/shared/form-input";
import { Icon } from "@/components/shared/icon";
import { Loader } from "@/components/shared/loader";
import { AmountCard } from "@/components/transfer/amount-card";
import { BankGrid } from "@/components/transfer/bank-grid";
import { TransferLayout } from "@/components/transfer/transfer-layout";
import { palette } from "@/constants/colors";
import { useAccount, useBanks } from "@/hooks/use-account";
import { ACCOUNT_NUMBER_LENGTH, ACCOUNT_NUMBER_PATTERN } from "@/config/transfer";
import { getErrorMessage } from "@/lib/errors";
import { calculateTotalDebit, minorToAmountInput, parseAmountToMinor } from "@/lib/money";
import { transferSchema, type transferFormData } from "@/lib/schema";
import { useTransferCoordinator } from "@/providers/pending-transfer-provider";
import { useTransfer } from "@/providers/transfer-provider";
import { resolveAccount } from "@/services/app.service";

export default function BankTransferScreen() {
  const { draft, setDraft } = useTransfer();
  // One unresolved transfer at a time: it must be confirmed before another can start.
  const { pending } = useTransferCoordinator();
  const account = useAccount();
  const banks = useBanks();

  const { control, handleSubmit, setError } = useForm<transferFormData>({
    resolver: zodResolver(transferSchema),
    mode: "onTouched",
    // Coming back from confirm keeps what the user typed.
    defaultValues: {
      recipientBankCode: draft?.bankCode ?? "",
      recipientAccountNumber: draft?.accountNumber ?? "",
      amount: draft ? minorToAmountInput(draft.amountMinor) : "",
      narration: draft?.narration ?? "",
    },
  });

  const [bankCode, accountNumber] = useWatch({
    control,
    name: ["recipientBankCode", "recipientAccountNumber"],
  });
  const canResolve = !!bankCode && ACCOUNT_NUMBER_PATTERN.test(accountNumber);

  const resolved = useQuery({
    queryKey: ["resolve-account", bankCode, accountNumber],
    queryFn: () => resolveAccount({ bankCode, accountNumber }),
    enabled: canResolve,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const recipient = canResolve ? resolved.data : undefined;

  const onSubmit = (values: transferFormData) => {
    if (!recipient) return;

    // The schema has already rejected anything unparseable.
    const amountMinor = parseAmountToMinor(values.amount);
    if (amountMinor === null) return;

    // The fee comes out of the same balance, so check the total debit, not just the amount.
    const balance = account.data?.availableBalanceMinor;
    if (balance !== undefined && calculateTotalDebit(amountMinor) > balance) {
      setError("amount", {
        message: "Amount plus the transfer fee is more than your available balance",
      });
      return;
    }

    setDraft({
      bankCode: recipient.bankCode,
      bankName: recipient.bankName,
      accountNumber: recipient.accountNumber,
      accountName: recipient.accountName,
      amountMinor,
      narration: values.narration?.trim() || `Transfer to ${recipient.accountName}`,
    });
    router.push("/transfer/confirm");
  };

  return (
    <TransferLayout
      title="Bank Transfer"
      footer={
        <Button
          title="Continue"
          disabled={!recipient || !!pending}
          onPress={() => handleSubmit(onSubmit)()}
        />
      }
    >
      {pending ? (
        <Banner
          tone="warning"
          className="mb-5"
          message={`Your transfer to ${pending.recipientName} is still being confirmed. You can send another once it's done.`}
          actionLabel="View"
          onAction={() =>
            pending.transactionId
              ? router.push({ pathname: "/transfer/receipt", params: { id: pending.transactionId } })
              : router.push("/transfer/verify")
          }
        />
      ) : null}
      <Text className="mb-5 text-xl font-semibold text-text">Select Bank</Text>
      {banks.isPending ? (
        <Loader />
      ) : banks.isError ? (
        <Button
          title="Couldn't load banks. Retry"
          variant="ghost"
          size="sm"
          onPress={() => banks.refetch()}
        />
      ) : (
        <Controller
          control={control}
          name="recipientBankCode"
          render={({ field, fieldState }) => (
            <BankGrid
              banks={banks.data}
              value={field.value}
              onChange={(bank) => field.onChange(bank.bankCode)}
              error={fieldState.error?.message}
            />
          )}
        />
      )}

      <FormInput
        control={control}
        name="recipientAccountNumber"
        label="Account Number"
        placeholder="0123456789"
        keyboardType="number-pad"
        maxLength={ACCOUNT_NUMBER_LENGTH}
        containerClassName="mt-4"
        left={<Icon name="spending" size={18} color={palette.muted} />}
        error={
          canResolve && resolved.isError
            ? getErrorMessage(resolved.error, "We couldn't verify this account")
            : undefined
        }
        hint={
          !canResolve ? undefined : resolved.isFetching ? (
            <Text className="text-xs text-muted">Verifying account…</Text>
          ) : recipient ? (
            <View className="flex-row items-center gap-1">
              <Icon name="checkCircle" size={14} color={palette.success} />
              <Text className="text-sm font-semibold text-success">
                {recipient.accountName}
              </Text>
            </View>
          ) : undefined
        }
      />

      <Text className="mb-3 mt-7 text-xl font-semibold text-text">Amount</Text>
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <AmountCard
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            balanceMinor={account.data?.availableBalanceMinor}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormInput
        control={control}
        name="narration"
        label="Note (optional)"
        placeholder="What's this for?"
        maxLength={100}
        containerClassName="mt-6"
      />
    </TransferLayout>
  );
}
