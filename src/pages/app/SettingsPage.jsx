import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import PremiumPromoCard from "../../components/shared/PremiumPromoCard";
import { navigateTo } from "../../lib/router";

const settingsSections = [
  { key: "personal", title: "Personligt", subtitle: "Din personliga information och hur vi kontaktar dig." },
  { key: "account", title: "Konto", subtitle: "Hantera kontotyp och aktiv roll." },
  { key: "premium", title: "Premium", subtitle: "Hantera premiumplan och fakturering." },
  { key: "verifications", title: "Verifieringar", subtitle: "Intyg, certifikat och kontovalidering." },
  { key: "notifications", title: "Notiser", subtitle: "Välj hur och när du vill få uppdateringar." },
  { key: "privacy", title: "Integritet", subtitle: "Cookie, datadelning och sekretessinställningar." },
  { key: "reports", title: "Rapporter", subtitle: "Exporter och sammanställningar av kontoaktivitet." },
  { key: "delete", title: "Radera konto", subtitle: "Permanent borttagning av konto och data." }
];

function SettingsRow({ title, subtitle, open, onToggle, children, isLast = false }) {
  return (
    <article className={isLast ? "" : "border-b border-black/10"}>
      <button
        type="button"
        className="-mx-6 flex w-[calc(100%+3rem)] items-center justify-between gap-4 !rounded-[14px] px-6 py-6 text-left transition hover:bg-black/5"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div>
          <h3 className="text-xl font-semibold leading-tight text-[#0f1930]">{title}</h3>
          <p className="mt-2.5 text-sm text-ink-600">{subtitle}</p>
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-ink-700 transition ${open ? "rotate-90" : ""}`}>
          <Icon name="arrowRight" className="h-4 w-4" />
        </span>
      </button>

      {open ? <div className="pb-6 pt-4">{children}</div> : null}
    </article>
  );
}

function SettingsPage({ app }) {
  const { user, switchRole, updateProfile } = app;
  const [openKey, setOpenKey] = useState("");
  const [pendingRole, setPendingRole] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [personalEditKey, setPersonalEditKey] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalDraft, setPersonalDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const activeRoleLabel = useMemo(() => (
    user?.role === "publisher" ? "Hyresvärd" : user?.role === "company_admin" ? "Bolagsadmin" : "Hyresgäst"
  ), [user?.role]);
  const roleSet = useMemo(() => new Set(
    [...(Array.isArray(user?.roles) ? user.roles : []), user?.role]
      .filter(Boolean)
      .map((role) => role === "publisher" ? "broker" : role)
  ), [user?.role, user?.roles]);
  const hasCompanyAdminRole = roleSet.has("company_admin");
  const isIdVerified = Boolean(user?.profile?.idVerified);
  const [firstName, ...restName] = String(user?.name || "").trim().split(" ");
  const lastName = restName.join(" ");

  useEffect(() => {
    setPersonalDraft({
      firstName: firstName || "",
      lastName: lastName || "",
      email: user?.email || "",
      phone: user?.phone || ""
    });
  }, [firstName, lastName, user?.email, user?.phone]);

  function toggleSection(key) {
    setOpenKey((prev) => (prev === key ? "" : key));
  }

  async function savePersonalEdit() {
    if (!updateProfile) return;
    const nextName = `${String(personalDraft.firstName || "").trim()} ${String(personalDraft.lastName || "").trim()}`.trim();
    setSavingPersonal(true);
    try {
      await updateProfile({
        name: nextName,
        phone: String(personalDraft.phone || "").trim(),
        email: String(personalDraft.email || "").trim()
      });
      app.pushToast?.("Inställningar uppdaterade.", "success");
      setPersonalEditKey("");
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte spara ändringar.", "error");
    } finally {
      setSavingPersonal(false);
    }
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col">
      <div data-scroll-top-scope="results" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-[860px]">
          <h1 className="text-2xl font-semibold text-[#0f1930]">Inställningar</h1>
          <p className="mt-2 text-sm text-ink-600">Hantera dina personuppgifter, kontoalternativ och notisinställningar.</p>
          <div className="h-6 sm:h-7" />
          <div className="space-y-0">
            {settingsSections.map((section) => (
              <SettingsRow
                key={section.key}
                title={section.title}
                subtitle={section.subtitle}
                open={openKey === section.key}
                onToggle={() => toggleSection(section.key)}
                isLast={section.key === "delete"}
              >
                  {section.key === "personal" ? (
                    <div className="space-y-6">
                      <article className="pb-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-[16px] font-semibold leading-tight text-[#0f1930]">Namn</p>
                            {personalEditKey === "name" ? (
                              <div className="mt-4 grid max-w-[560px] gap-3 sm:grid-cols-2">
                                <div className="max-w-[260px]">
                                  <label className="mb-1 block text-sm text-ink-700">Förnamn</label>
                                  <input className="field" value={personalDraft.firstName} onChange={(event) => setPersonalDraft((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="Förnamn" />
                                </div>
                                <div className="max-w-[260px]">
                                  <label className="mb-1 block text-sm text-ink-700">Efternamn</label>
                                  <input className="field" value={personalDraft.lastName} onChange={(event) => setPersonalDraft((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Efternamn" />
                                </div>
                              </div>
                            ) : (
                              <p className="mt-2 text-[16px] leading-tight text-ink-700">{user?.name || "-"}</p>
                            )}
                          </div>
                          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-ink-700 hover:bg-[#f8fafc]" onClick={() => setPersonalEditKey((prev) => (prev === "name" ? "" : "name"))}>
                            <Icon name="pencil" className="h-4 w-4" />
                          </button>
                        </div>
                        {personalEditKey === "name" ? (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button type="button" className="btn-primary px-5 py-2.5 text-sm" disabled={savingPersonal} onClick={savePersonalEdit}>
                              {savingPersonal ? "Sparar..." : "Spara"}
                            </button>
                            <button type="button" className="btn-secondary px-5 py-2.5 text-sm" disabled={savingPersonal} onClick={() => setPersonalEditKey("")}>
                              Avbryt
                            </button>
                          </div>
                        ) : null}
                      </article>

                      <article className="pb-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-[16px] font-semibold leading-tight text-[#0f1930]">E-post</p>
                            {personalEditKey === "email" ? (
                              <div className="mt-4 max-w-[420px]">
                                <label className="mb-1 block text-sm text-ink-700">E-post</label>
                                <input className="field" value={personalDraft.email} onChange={(event) => setPersonalDraft((prev) => ({ ...prev, email: event.target.value }))} placeholder="namn@domän.se" />
                              </div>
                            ) : (
                              <>
                                <p className="mt-2 text-[16px] leading-tight text-ink-700">{user?.email || "-"}</p>
                                <p className="mt-2 text-sm text-ink-500">E-post verifierad</p>
                              </>
                            )}
                          </div>
                          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-ink-700 hover:bg-[#f8fafc]" onClick={() => setPersonalEditKey((prev) => (prev === "email" ? "" : "email"))}>
                            <Icon name="pencil" className="h-4 w-4" />
                          </button>
                        </div>
                        {personalEditKey === "email" ? (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button type="button" className="btn-primary px-5 py-2.5 text-sm" disabled={savingPersonal} onClick={savePersonalEdit}>
                              {savingPersonal ? "Sparar..." : "Spara"}
                            </button>
                            <button type="button" className="btn-secondary px-5 py-2.5 text-sm" disabled={savingPersonal} onClick={() => setPersonalEditKey("")}>
                              Avbryt
                            </button>
                          </div>
                        ) : null}
                      </article>

                      <article className="pb-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-[16px] font-semibold leading-tight text-[#0f1930]">Telefonnummer</p>
                            {personalEditKey === "phone" ? (
                              <div className="mt-4 max-w-[340px]">
                                <label className="mb-1 block text-sm text-ink-700">Telefonnummer</label>
                                <input className="field" value={personalDraft.phone} onChange={(event) => setPersonalDraft((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+46..." />
                              </div>
                            ) : (
                              <p className="mt-2 text-[16px] leading-tight text-ink-700">{user?.phone || "Ej angivet"}</p>
                            )}
                          </div>
                          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-ink-700 hover:bg-[#f8fafc]" onClick={() => setPersonalEditKey((prev) => (prev === "phone" ? "" : "phone"))}>
                            <Icon name="pencil" className="h-4 w-4" />
                          </button>
                        </div>
                        {personalEditKey === "phone" ? (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button type="button" className="btn-primary px-5 py-2.5 text-sm" disabled={savingPersonal} onClick={savePersonalEdit}>
                              {savingPersonal ? "Sparar..." : "Spara"}
                            </button>
                            <button type="button" className="btn-secondary px-5 py-2.5 text-sm" disabled={savingPersonal} onClick={() => setPersonalEditKey("")}>
                              Avbryt
                            </button>
                          </div>
                        ) : null}
                      </article>

                      <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm text-ink-600">
                        Dessa uppgifter är privata. Endast relevant information visas publikt i din profil.
                      </div>
                    </div>
                  ) : null}

                  {section.key === "account" ? (
                    <div className="space-y-3">
                      <p className="text-sm text-ink-700">Aktiv roll: <span className="font-semibold">{activeRoleLabel}</span></p>
                      <div className="flex flex-wrap gap-2">
                        {user?.role === "publisher" || user?.role === "company_admin" ? (
                          <button
                            type="button"
                            className="btn-secondary px-4 py-2 text-xs"
                            disabled={pendingRole}
                            onClick={async () => {
                              setPendingRole(true);
                              try {
                                await switchRole?.("renter");
                              } finally {
                                setPendingRole(false);
                              }
                            }}
                          >
                            Växla till Hyresgäst
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary px-4 py-2 text-xs"
                            disabled={pendingRole}
                            onClick={async () => {
                              setPendingRole(true);
                              try {
                                if (hasCompanyAdminRole) {
                                  await switchRole?.("company_admin");
                                  navigateTo("/app/admin");
                                } else {
                                  await switchRole?.("publisher");
                                }
                              } finally {
                                setPendingRole(false);
                              }
                            }}
                          >
                            {hasCompanyAdminRole ? "Växla till Företag" : "Växla till Hyresvärd"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {section.key === "premium" ? (
                    <PremiumPromoCard />
                  ) : null}

                  {section.key === "verifications" ? (
                    <div className="space-y-4">
                      {isIdVerified ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#241d1a]">
                          <span
                            className="inline-flex h-5 w-5 items-center justify-center bg-[#0f1930] text-white"
                            style={{ clipPath: "polygon(50% 1%,58% 4%,66% 2%,73% 8%,81% 8%,88% 15%,96% 19%,99% 28%,97% 36%,99% 44%,94% 51%,95% 59%,89% 66%,86% 75%,78% 79%,71% 86%,62% 87%,55% 94%,47% 92%,39% 97%,32% 91%,23% 91%,18% 83%,9% 81%,6% 72%,1% 65%,3% 56%,0% 48%,6% 41%,4% 33%,10% 26%,11% 17%,20% 13%,25% 5%,34% 5%,42% 1%)" }}
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                              <path d="M5.5 12.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          ID verifierad
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                          <p className="text-sm font-semibold text-amber-800">Din identitet är inte verifierad ännu.</p>
                          <p className="mt-1 text-sm text-amber-700">Verifiera dig för ökad trygghet och bättre synlighet i plattformen.</p>
                          <button
                            type="button"
                            className="btn-primary mt-3 px-4 py-2 text-xs"
                            disabled={pendingVerification}
                            onClick={async () => {
                              if (!updateProfile) return;
                              setPendingVerification(true);
                              try {
                                await updateProfile({
                                  profile: {
                                    ...(user?.profile || {}),
                                    idVerified: true
                                  }
                                });
                                app.pushToast?.("ID verifiering genomförd.", "success");
                              } catch (error) {
                                app.pushToast?.(error.message || "Kunde inte verifiera ID.", "error");
                              } finally {
                                setPendingVerification(false);
                              }
                            }}
                          >
                            {pendingVerification ? "Verifierar..." : "Verifiera med BankID"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {section.key !== "personal" && section.key !== "account" && section.key !== "premium" && section.key !== "verifications" ? (
                    <div className="rounded-2xl border border-black/10 bg-[#fafbfd] px-3 py-3 text-sm text-ink-600">
                      Innehåll för <span className="font-semibold text-ink-800">{section.title.toLowerCase()}</span> kommer i nästa iteration.
                    </div>
                  ) : null}
              </SettingsRow>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
