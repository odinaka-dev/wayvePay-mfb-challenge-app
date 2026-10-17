import * as Crypto from "expo-crypto";
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";

export type TransferDraft = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amountMinor: number;
  narration: string;
};

type TransferContextValue = {
  draft: TransferDraft | null;
  idempotencyKey: string | null;
  setDraft: (draft: TransferDraft) => void;
  renewKey: () => void;
  reset: () => void;
};

const TransferContext = createContext<TransferContextValue | null>(null);

const isSameDraft = (a: TransferDraft | null, b: TransferDraft) =>
  !!a &&
  a.bankCode === b.bankCode &&
  a.accountNumber === b.accountNumber &&
  a.amountMinor === b.amountMinor &&
  a.narration === b.narration;

export function TransferProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<{
    draft: TransferDraft | null;
    idempotencyKey: string | null;
  }>({ draft: null, idempotencyKey: null });

  const setDraft = (draft: TransferDraft) =>
    setState((prev) => ({
      draft,
      idempotencyKey:
        isSameDraft(prev.draft, draft) && prev.idempotencyKey
          ? prev.idempotencyKey
          : Crypto.randomUUID(),
    }));

  const renewKey = () =>
    setState((prev) => ({
      ...prev,
      idempotencyKey: prev.draft ? Crypto.randomUUID() : null,
    }));

  const reset = () => setState({ draft: null, idempotencyKey: null });

  return (
    <TransferContext value={{ ...state, setDraft, renewKey, reset }}>
      {children}
    </TransferContext>
  );
}

export function useTransfer() {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error("useTransfer must be used inside TransferProvider");
  }
  return context;
}
