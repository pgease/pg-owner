import { useState, useEffect, useCallback, useId } from "react";
import {
  Building,
  CheckCircle2,
  QrCode,
  Download,
  Printer,
  Copy,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  Plus,
  Trash2,
  Star,
  CreditCard,
  Zap,
  Sparkles,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { authStorage } from "@/api/http";
import {
  getSettlementBankAccounts,
  addSettlementBankAccount,
  setPrimarySettlementBankAccount,
  deleteSettlementBankAccount,
  lookupIfsc,
  getPaymentSettings,
  updatePaymentSettings,
  type SettlementBankAccountItem,
  type IfscLookupResponse,
} from "@/api/propertyOwner";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export const BankAccountManager = () => {
  const formId = useId();
  const { selectedPgId, properties } = useApp();
  const selectedPg = properties.find((p) => p.id === selectedPgId);
  const currentOwner = authStorage.getPropertyOwner();

  // Loading & View States
  const [isLoading, setIsLoading] = useState(true);
  const [isCopiedUpi, setIsCopiedUpi] = useState<string | null>(null);
  const [revealedAccounts, setRevealedAccounts] = useState<Record<string, boolean>>({});

  // List of accounts & Primary
  const [accounts, setAccounts] = useState<SettlementBankAccountItem[]>([]);
  const [primaryAccount, setPrimaryAccount] = useState<SettlementBankAccountItem | null>(null);
  const [ownerUpiId, setOwnerUpiId] = useState<string>("");

  // Selected account for Standee QR
  const [selectedForQr, setSelectedForQr] = useState<string>("");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"bank" | "upi">("bank");
  const [isSaving, setIsSaving] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Bank Form State
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("current");
  const [isPrimaryNew, setIsPrimaryNew] = useState(false);
  const [bankErrors, setBankErrors] = useState<string[]>([]);

  // UPI Form State
  const [upiInput, setUpiInput] = useState("");
  const [upiPayeeName, setUpiPayeeName] = useState("");
  const [upiErrors, setUpiErrors] = useState<string[]>([]);

  // IFSC Lookup State
  const [isLookingUpIfsc, setIsLookingUpIfsc] = useState(false);
  const [ifscResult, setIfscResult] = useState<IfscLookupResponse | null>(null);
  const [ifscError, setIfscError] = useState<string | null>(null);

  // Delete Confirmation State
  const [accountToDelete, setAccountToDelete] = useState<SettlementBankAccountItem | null>(null);

  // 1. Fetch settlement bank accounts and owner payment settings
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accountsRes, settingsRes] = await Promise.allSettled([
        getSettlementBankAccounts(),
        getPaymentSettings(),
      ]);

      if (accountsRes.status === "fulfilled" && accountsRes.value?.success && Array.isArray(accountsRes.value.accounts)) {
        setAccounts(accountsRes.value.accounts);
        const prim = accountsRes.value.primaryAccount || accountsRes.value.accounts.find((a) => a.isPrimary) || accountsRes.value.accounts[0] || null;
        setPrimaryAccount(prim);
        if (prim && !selectedForQr) {
          setSelectedForQr(prim.id);
        }
      } else {
        setAccounts([]);
        setPrimaryAccount(null);
      }

      if (settingsRes.status === "fulfilled" && settingsRes.value?.upiId) {
        setOwnerUpiId(settingsRes.value.upiId.trim());
      }
    } catch (err: unknown) {
      console.warn("Could not fetch settlement bank accounts:", err);
      // Fallback check from localStorage
      const cached = localStorage.getItem(`pgease_bank_details_${currentOwner?.name || "default"}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const fallbackAcc: SettlementBankAccountItem = {
            id: "local_default",
            ...parsed,
            isPrimary: true,
          };
          setAccounts([fallbackAcc]);
          setPrimaryAccount(fallbackAcc);
          setSelectedForQr("local_default");
          if (parsed.upiId) setOwnerUpiId(parsed.upiId);
        } catch {
          setAccounts([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentOwner?.name, selectedForQr]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 2. Real-time debounced IFSC lookup in Bank Form
  useEffect(() => {
    const clean = ifscCode.trim().toUpperCase();
    if (clean.length !== 11) {
      setIfscResult(null);
      setIfscError(null);
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(clean)) {
      setIfscError("5th character must be '0' (e.g. HDFC0000001)");
      setIfscResult(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLookingUpIfsc(true);
      setIfscError(null);
      try {
        const data = await lookupIfsc(clean);
        if (!isMounted) return;

        if (data && data.valid) {
          setIfscResult(data);
          setIfscError(null);
          if (data.bank) setBankName(data.bank);
          if (data.branch) setBranch(data.branch);
        } else {
          setIfscResult(null);
          setIfscError(data?.message || "IFSC code not found in central bank directory");
        }
      } catch {
        if (!isMounted) return;
        setIfscResult(null);
        setIfscError("Unable to verify IFSC right now, but format is valid");
      } finally {
        if (isMounted) setIsLookingUpIfsc(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [ifscCode]);

  // Open modal with specific tab
  const handleOpenModal = (tab: "bank" | "upi") => {
    setModalTab(tab);
    setBankErrors([]);
    setUpiErrors([]);
    if (tab === "bank") {
      setAccountHolder(currentOwner?.name || "");
      setBankName("");
      setBranch("");
      setAccountNumber("");
      setConfirmAccountNumber("");
      setIfscCode("");
      setAccountType("current");
      setIsPrimaryNew(accounts.length === 0);
      setIfscResult(null);
      setIfscError(null);
    } else {
      setUpiInput(ownerUpiId || primaryAccount?.upiId || "");
      setUpiPayeeName(selectedPg?.name || currentOwner?.name || "PG Ease Stay");
    }
    setIsModalOpen(true);
  };

  // 3. Save Bank Account (ONLY Bank fields, NO UPI)
  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAcc = accountNumber.replace(/\s/g, "");
    const cleanIfsc = ifscCode.trim().toUpperCase();
    const problems: string[] = [];

    if (!accountHolder.trim()) problems.push("Account holder name is required.");
    if (!/^\d{9,18}$/.test(cleanAcc)) problems.push("Account number must be 9 to 18 digits.");
    if (cleanAcc !== confirmAccountNumber.replace(/\s/g, "")) problems.push("Account numbers do not match.");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) problems.push("Enter a valid 11-digit IFSC code (e.g. HDFC0001234).");

    if (problems.length > 0) {
      setBankErrors(problems);
      return;
    }
    setBankErrors([]);
    setIsSaving(true);

    const payload = {
      accountHolderName: accountHolder.trim(),
      accountNumber: cleanAcc,
      ifscCode: cleanIfsc,
      bankName: bankName.trim() || ifscResult?.bank || "Bank Account",
      branch: branch.trim() || ifscResult?.branch || "",
      accountType,
      isPrimary: isPrimaryNew || accounts.length === 0,
    };

    try {
      const res = await addSettlementBankAccount(payload);
      if (res?.success) {
        setAccounts(res.accounts);
        if (res.primaryAccount) setPrimaryAccount(res.primaryAccount);
        if (res.account?.id) setSelectedForQr(res.account.id);

        toast({
          title: "Bank Account Added! 🎉",
          description: `Linked ${res.account?.bankName || payload.bankName} (••••${cleanAcc.slice(-4)}) successfully.`,
        });
        setIsModalOpen(false);
      } else {
        throw new Error(res?.message || "Failed to add bank account");
      }
    } catch (err: unknown) {
      toast({
        title: "Failed to add bank account",
        description: (err as Error)?.message || "Please verify the details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Save UPI ID (ONLY UPI fields, NO Bank/IFSC)
  const handleSaveUpiId = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUpi = upiInput.trim().toLowerCase();
    const problems: string[] = [];

    if (!cleanUpi) {
      problems.push("UPI ID is required.");
    } else if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(cleanUpi)) {
      problems.push("Invalid UPI ID format. Must look like name@bank (e.g. rahul@okhdfcbank, shreepg@icici).");
    }

    if (problems.length > 0) {
      setUpiErrors(problems);
      return;
    }
    setUpiErrors([]);
    setIsSaving(true);

    try {
      const res = await updatePaymentSettings({
        paymentMode: "MANUAL",
        upiId: cleanUpi,
      });

      setOwnerUpiId(cleanUpi);

      // If we have accounts, update the primary account's UPI in state
      if (primaryAccount) {
        const updatedAccounts = accounts.map((acc) =>
          acc.id === primaryAccount.id ? { ...acc, upiId: cleanUpi } : acc
        );
        setAccounts(updatedAccounts);
        setPrimaryAccount({ ...primaryAccount, upiId: cleanUpi });
      }

      toast({
        title: "UPI ID Saved! 🎉",
        description: `Standee QR is now active for ${cleanUpi}.`,
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Failed to update UPI ID",
        description: (err as Error)?.message || "Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Set as Primary
  const handleSetPrimary = async (accId: string) => {
    setActionInProgress(accId);
    try {
      const res = await setPrimarySettlementBankAccount(accId);
      if (res?.success) {
        setAccounts(res.accounts);
        if (res.primaryAccount) setPrimaryAccount(res.primaryAccount);
        setSelectedForQr(accId);
        toast({
          title: "Primary Account Updated ⭐",
          description: "New rent collections will default to this account.",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not set primary account",
        description: (err as Error)?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // 6. Delete Account
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    const accId = accountToDelete.id;
    setActionInProgress(accId);
    try {
      const res = await deleteSettlementBankAccount(accId);
      if (res?.success) {
        setAccounts(res.accounts);
        if (res.primaryAccount) setPrimaryAccount(res.primaryAccount);
        if (selectedForQr === accId) {
          setSelectedForQr(res.primaryAccount?.id || (res.accounts[0]?.id ?? ""));
        }
        toast({
          title: "Account Removed",
          description: "Settlement account has been removed successfully.",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not delete account",
        description: (err as Error)?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
      setAccountToDelete(null);
    }
  };

  const copyUpi = (upiString: string) => {
    if (!upiString) return;
    navigator.clipboard.writeText(upiString);
    setIsCopiedUpi(upiString);
    setTimeout(() => setIsCopiedUpi(null), 2000);
    toast({ title: "UPI ID Copied to Clipboard 📋" });
  };

  const toggleRevealAccount = (id: string) => {
    setRevealedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatMaskedAccount = (num: string) => {
    if (!num) return "—";
    if (num.length <= 4) return num;
    return `•••• •••• ${num.slice(-4)}`;
  };

  // Active account and UPI for QR Standee
  const activeQrAccount = accounts.find((a) => a.id === selectedForQr) || primaryAccount || accounts[0] || null;
  const activeUpiId = activeQrAccount?.upiId?.trim() || ownerUpiId?.trim() || "";
  const upiQrString = activeUpiId
    ? `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(
        selectedPg?.name || activeQrAccount?.accountHolderName || currentOwner?.name || "PG Ease Stay"
      )}&cu=INR`
    : "";

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-96 rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* 1. PROFESSIONAL SETTLEMENT BANNER */}
      <div className="rounded-xl border bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Accounts tenants can pay into</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Add each bank account here. On a tenant’s profile you choose which one that tenant should use.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenModal("bank")}
            className="flex-1 sm:flex-initial rounded-xl text-xs gap-1.5 font-semibold border-slate-300 hover:bg-slate-100 dark:border-slate-700"
          >
            <Building className="h-3.5 w-3.5 text-teal-600" /> + Add Bank Account
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenModal("upi")}
            className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-xs"
          >
            <QrCode className="h-3.5 w-3.5" /> + Set Up UPI
          </Button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LINKED BANK ACCOUNTS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building className="h-4 w-4 text-teal-600" /> Bank Accounts (IMPS / NEFT)
                <Badge variant="secondary" className="text-xs font-mono px-2 py-0">
                  {accounts.length}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Verified bank accounts for tenant settlements and manual bank transfers.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAccounts}
                className="h-8 text-xs gap-1 text-muted-foreground rounded-xl"
                title="Refresh accounts"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </div>
          </div>

          {/* EMPTY STATE FOR BANK ACCOUNTS */}
          {accounts.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 p-8 text-center space-y-3 bg-muted/10">
              <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950 mx-auto flex items-center justify-center text-teal-600">
                <Building className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground">No Bank Account Linked</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Add your bank account number and IFSC code to receive direct tenant deposits with zero commission.
                </p>
              </div>
              <Button
                onClick={() => handleOpenModal("bank")}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Bank Account
              </Button>
            </Card>
          ) : (
            accounts.map((acc) => {
              const isPrimary = acc.isPrimary || primaryAccount?.id === acc.id;
              const isRevealed = revealedAccounts[acc.id];
              const isThisForQr = selectedForQr === acc.id;

              return (
                <Card
                  key={acc.id}
                  className={cn(
                    "rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden",
                    isPrimary ? "border-teal-500/50 bg-teal-50/15 dark:bg-teal-950/10" : "border-border/80"
                  )}
                >
                  <CardHeader className="bg-muted/20 pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 font-bold shrink-0">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {acc.bankName || "Bank Account"}
                            </span>
                            {isPrimary && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px] font-bold gap-1 py-0 px-2">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Default Primary
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {acc.branch ? `${acc.branch} Branch` : `${acc.accountType || "Current"} Account`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isPrimary && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50 font-semibold px-2"
                            onClick={() => handleSetPrimary(acc.id)}
                            disabled={actionInProgress === acc.id}
                          >
                            {actionInProgress === acc.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Star className="h-3 w-3 mr-1" />
                            )}
                            Make Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setAccountToDelete(acc)}
                          title="Delete Account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs">
                    {/* Grid Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Holder</span>
                        <p className="font-bold text-foreground truncate">{acc.accountHolderName}</p>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">A/C Number</span>
                          <button
                            type="button"
                            onClick={() => toggleRevealAccount(acc.id)}
                            className="text-teal-600 hover:text-teal-700"
                            title={isRevealed ? "Hide number" : "Reveal number"}
                          >
                            {isRevealed ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                          </button>
                        </div>
                        <p className="font-mono font-bold text-foreground">
                          {isRevealed ? acc.accountNumber : formatMaskedAccount(acc.accountNumber)}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">IFSC</span>
                        <p className="font-mono font-bold text-foreground uppercase">{acc.ifscCode}</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Type</span>
                        <p className="font-medium text-foreground capitalize">{acc.accountType || "Current"}</p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", acc.isVerified ? "text-emerald-600" : "text-amber-600")} />
                        {acc.isVerified ? "Verified for tenant settlements" : "Valid IFSC format registered"}
                      </span>
                      {acc.upiId ? (
                        <Badge variant="outline" className="font-mono text-[10px] text-teal-700 border-teal-300">
                          UPI: {acc.upiId}
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: UPI QR STANDEE PREVIEW */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-teal-600" /> Collection Standee QR
              </CardTitle>
              <CardDescription className="text-xs">
                Scan using any UPI app (GPay, PhonePe, Paytm, BHIM)
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              {activeUpiId ? (
                <>
                  {/* Standee Frame Card */}
                  <div
                    className="p-5 rounded-2xl bg-white border-2 border-dashed border-teal-300 shadow-md flex flex-col items-center justify-center space-y-3 w-full max-w-[260px]"
                    role="img"
                    aria-label={`UPI QR for ${selectedPg?.name || "this PG"}, payee ${activeUpiId}`}
                  >
                    <div className="text-center">
                      <p className="font-extrabold text-sm text-slate-900 tracking-tight">
                        {selectedPg?.name || "Your PG Property"}
                      </p>
                      <a
                        href={upiQrString}
                        className="inline-flex min-h-11 items-center text-[10px] font-semibold uppercase tracking-wider text-teal-600 underline-offset-2 hover:underline"
                      >
                        Scan & Pay Rent
                      </a>
                    </div>

                    <QRCodeSVG
                      value={upiQrString}
                      size={180}
                      level="M"
                      includeMargin={false}
                      className="mx-auto rounded-lg"
                      title={`UPI QR for ${selectedPg?.name || "this PG"}`}
                    />

                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        All UPI Apps Accepted
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-center gap-1.5">
                      <Badge variant="secondary" className="font-mono text-[11px] px-3 py-1 font-bold">
                        {activeUpiId}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => copyUpi(activeUpiId)}
                        title="Copy UPI ID"
                      >
                        {isCopiedUpi === activeUpiId ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {activeQrAccount && (
                      <p className="text-[11px] text-muted-foreground">
                        Settlement to: {activeQrAccount.bankName} (••••{activeQrAccount.accountNumber?.slice(-4)})
                      </p>
                    )}
                  </div>

                  {/* Actions for Configured QR */}
                  <div className="space-y-2 w-full pt-2">
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl text-xs gap-1.5 font-semibold"
                        onClick={() =>
                          toast({
                            title: "Standee PDF Ready 📄",
                            description: "Use Print or Save as PDF to print this standee for your reception.",
                          })
                        }
                      >
                        <Download className="h-3.5 w-3.5" /> Download Standee
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs px-3"
                        onClick={() => window.print()}
                        title="Print Standee"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal("upi")}
                      className="w-full text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl gap-1.5"
                    >
                      <Pencil className="h-3 w-3" /> Change UPI ID
                    </Button>
                  </div>
                </>
              ) : (
                /* EMPTY STATE FOR UPI STANDEE */
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3 w-full">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mx-auto">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-amber-900">No UPI ID Added</p>
                    <p className="text-xs text-amber-700">
                      Configure your UPI ID (e.g. name@bank) to generate and download your custom collection standee QR.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenModal("upi")}
                    className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Set Up UPI ID
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. DEDICATED DIALOG: CLEAN TABBED SETUP (BANK vs UPI) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {modalTab === "bank" ? (
                <>
                  <Building className="h-4 w-4 text-teal-600" /> Add Bank Account
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 text-teal-600" /> Set Up Collection UPI ID
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {modalTab === "bank"
                ? "Enter your bank details for direct tenant deposits and settlements."
                : "Enter your UPI ID to generate your custom reception standee QR."}
            </DialogDescription>
          </DialogHeader>

          {/* TAB SELECTOR: BANK vs UPI */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl my-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setModalTab("bank");
                setBankErrors([]);
              }}
              className={cn(
                "py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all",
                modalTab === "bank"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building className="h-3.5 w-3.5 text-teal-600" />
              Bank Account
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab("upi");
                setUpiErrors([]);
                if (!upiInput) setUpiInput(ownerUpiId || primaryAccount?.upiId || "");
                if (!upiPayeeName) setUpiPayeeName(selectedPg?.name || currentOwner?.name || "PG Ease Stay");
              }}
              className={cn(
                "py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all",
                modalTab === "upi"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <QrCode className="h-3.5 w-3.5 text-teal-600" />
              UPI ID (VPA)
            </button>
          </div>

          {/* TAB CONTENT 1: BANK ACCOUNT ONLY */}
          {modalTab === "bank" && (
            <form onSubmit={handleSaveBankAccount} className="space-y-3.5 text-xs pt-1">
              {bankErrors.length > 0 && (
                <ul className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 space-y-1" role="alert">
                  {bankErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}

              {/* Account Holder Name */}
              <div className="space-y-1">
                <Label htmlFor={`${formId}-holder`} className="text-xs font-semibold">
                  Account Holder Name *
                </Label>
                <Input
                  id={`${formId}-holder`}
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. Rahul Sharma or Shree PG Enterprises"
                  required
                  className="h-9 text-xs rounded-xl font-medium"
                />
              </div>

              {/* IFSC Code with Real-Time Lookup */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${formId}-ifsc`} className="text-xs font-semibold">
                    IFSC Code *
                  </Label>
                  {isLookingUpIfsc && (
                    <span className="text-[10px] text-teal-600 flex items-center gap-1 font-medium animate-pulse">
                      <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id={`${formId}-ifsc`}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0000001"
                    maxLength={11}
                    required
                    className={cn(
                      "h-9 text-xs rounded-xl uppercase font-mono tracking-wider",
                      ifscResult ? "border-emerald-500 pr-8" : "",
                      ifscError ? "border-destructive pr-8" : ""
                    )}
                  />
                  {ifscResult && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 absolute right-2.5 top-2.5" />
                  )}
                  {ifscError && (
                    <AlertCircle className="h-4 w-4 text-destructive absolute right-2.5 top-2.5" />
                  )}
                </div>

                {/* IFSC Lookup Success Preview */}
                {ifscResult && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">{ifscResult.bank}</span>
                      {ifscResult.branch && ` — ${ifscResult.branch}`}
                      {ifscResult.city && ` (${ifscResult.city})`}
                    </div>
                  </div>
                )}

                {/* IFSC Error Warning */}
                {ifscError && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {ifscError}
                  </p>
                )}
              </div>

              {/* Bank Name & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`${formId}-bankName`} className="text-xs">
                    Bank Name
                  </Label>
                  <Input
                    id={`${formId}-bankName`}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="h-9 text-xs rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`${formId}-branch`} className="text-xs">
                    Branch
                  </Label>
                  <Input
                    id={`${formId}-branch`}
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Nariman Point"
                    className="h-9 text-xs rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Account Number & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`${formId}-accNum`} className="text-xs font-semibold">
                    Account Number *
                  </Label>
                  <Input
                    id={`${formId}-accNum`}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ""))}
                    type="password"
                    placeholder="Enter account number"
                    required
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`${formId}-confirmAcc`} className="text-xs font-semibold">
                    Confirm Account *
                  </Label>
                  <Input
                    id={`${formId}-confirmAcc`}
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\s+/g, ""))}
                    placeholder="Re-enter account number"
                    required
                    className={cn(
                      "h-9 text-xs rounded-xl font-mono",
                      confirmAccountNumber && accountNumber !== confirmAccountNumber
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    )}
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Account Type</Label>
                <Select
                  value={accountType}
                  onValueChange={(val: "savings" | "current") => setAccountType(val)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Account (Business)</SelectItem>
                    <SelectItem value="savings">Savings Account (Individual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Set as Primary Checkbox */}
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`${formId}-primary`}
                  checked={isPrimaryNew}
                  onChange={(e) => setIsPrimaryNew(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <Label htmlFor={`${formId}-primary`} className="text-xs cursor-pointer font-medium text-muted-foreground">
                  Set as default primary account for rent collections
                </Label>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs gap-1.5"
                >
                  {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Add Bank Account
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* TAB CONTENT 2: UPI ID ONLY */}
          {modalTab === "upi" && (
            <form onSubmit={handleSaveUpiId} className="space-y-4 text-xs pt-1">
              {upiErrors.length > 0 && (
                <ul className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 space-y-1" role="alert">
                  {upiErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}

              {/* UPI ID (VPA) */}
              <div className="space-y-1">
                <Label htmlFor={`${formId}-upiId`} className="text-xs font-semibold">
                  UPI ID (VPA) *
                </Label>
                <Input
                  id={`${formId}-upiId`}
                  value={upiInput}
                  onChange={(e) => setUpiInput(e.target.value.toLowerCase())}
                  placeholder="e.g. rahul@okaxis or shreepg@icici"
                  required
                  className="h-9 text-xs rounded-xl font-mono font-medium"
                />
                <p className="text-[10px] text-muted-foreground">
                  Enter your VPA linked to GPay, PhonePe, Paytm, or BHIM.
                </p>
              </div>

              {/* Display / Payee Name */}
              <div className="space-y-1">
                <Label htmlFor={`${formId}-payeeName`} className="text-xs font-semibold">
                  Payee / PG Name on Standee *
                </Label>
                <Input
                  id={`${formId}-payeeName`}
                  value={upiPayeeName}
                  onChange={(e) => setUpiPayeeName(e.target.value)}
                  placeholder="e.g. Shivam PG / Rahul Sharma"
                  required
                  className="h-9 text-xs rounded-xl font-medium"
                />
              </div>

              {/* Real-time Standee QR Preview inside modal */}
              {upiInput.trim() && /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiInput.trim()) && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-teal-200 dark:border-teal-900/50 flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg border shadow-xs shrink-0">
                    <QRCodeSVG
                      value={`upi://pay?pa=${encodeURIComponent(upiInput.trim())}&pn=${encodeURIComponent(
                        upiPayeeName.trim() || "PG Ease"
                      )}&cu=INR`}
                      size={64}
                      level="M"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground truncate">
                        {upiPayeeName || "PG Property"}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[9px] font-bold py-0">
                        Live Preview
                      </Badge>
                    </div>
                    <p className="font-mono text-[11px] text-teal-700 dark:text-teal-400 font-bold truncate">
                      {upiInput.trim()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Ready for instant tenant payments.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs gap-1.5"
                >
                  {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Save UPI ID
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 4. DIALOG: CONFIRM DELETE ACCOUNT */}
      <Dialog open={Boolean(accountToDelete)} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Remove Bank Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove{" "}
              <span className="font-bold text-foreground">
                {accountToDelete?.bankName} (••••{accountToDelete?.accountNumber?.slice(-4)})
              </span>
              ? Tenants assigned to this account will fall back to your primary account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAccountToDelete(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={Boolean(actionInProgress)}
              className="rounded-xl text-xs font-bold"
            >
              {actionInProgress ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
              Remove Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
