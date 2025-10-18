/**
 * File path: /client_profile/page.tsx
 * Authors:
 * - Frontend UI Build: Devni Wijesinghe
 * - Backend logic: Denise Alexander
 * Updated by Qingyue Zhao: 03-10-2025
 * Last Updated by Denise Alexander: 07-10-2025 (back-end integration)
 *
 * Notes:
 * - Fixed-height viewport section (h-[680px]) to avoid bottom gutters.
 * - Family view: two-column editable; Management: same layout, read-only.
 * - "Create one here" triggers AddAccessCodePanel.
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import AddAccessCodePanel from '@/components/accesscode/access-code';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { useActiveClient } from '@/context/ActiveClientContext';
import { ChevronDown, ChevronUp, ArrowLeft, User } from 'lucide-react';

import {
  getClients,
  getClientById,
  getViewerRole,
  type Client as ApiClient,
} from '@/lib/data';

type Role = 'family' | 'carer' | 'management';

const colors = {
  pageBg: '#F7ECD9',
  pageBg2: '#ffd9b3',
  cardBg: '#F7ECD9',
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  fieldBorder: 'rgba(58,0,0,0.45)',
};

export default function ClientProfilePage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 24 }}>Loading client profile...</div>}
    >
      <ClientProfilePageInner />
    </Suspense>
  );
}

function ClientProfilePageInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // --- Extract query parameters ---
  const clientIdParam = sp.get('id') || null;
  const isNew = sp.get('new') === 'true';

  // ---- Logged-in user role state ----
  const [role, setRole] = useState<Role>('family');
  useEffect(() => {
    (async () => {
      const r = await getViewerRole();
      if (r === 'family' || r === 'carer' || r === 'management') setRole(r);
    })();
  }, []);

  const isFamily = role === 'family';
  const isManagement = role === 'management';
  const isCarer = role === 'carer';

  // --- Back navigation based on role ---
  const backHref = isManagement
    ? '/management_dashboard/clients_list'
    : isCarer
      ? '/calendar_dashboard'
      : '/family_dashboard/people_list';

  // ---- top chrome client switcher ----
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const { client: activeClient, handleClientChange } = useActiveClient();

  // ---- profile fields ----
  const [avatarUrl, setAvatarUrl] = useState('');

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [primaryCaregiver, setPrimaryCaregiver] = useState('');
  const [address, setAddress] = useState('');

  const [diagnosedDisabilities, setDiagnosedDisabilities] = useState('');
  const [currentMedication, setCurrentMedication] = useState('');
  const [allergies, setAllergies] = useState('');
  const [recentMedicalHistory, setRecentMedicalHistory] = useState('');
  const [primaryHealthContact, setPrimaryHealthContact] = useState('');

  const [loading, setLoading] = useState<boolean>(!!clientIdParam && !isNew);
  const [error, setError] = useState('');

  // ---- access-code drawer ----
  const [showAccessCodeDrawer, setShowAccessCodeDrawer] = useState(false);

  // ---- avatar upload ----
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  // ---- load clients ----
  useEffect(() => {
    // Skip pre-filling for new client creation
    if (isNew) {
      return;
    }

    (async () => {
      try {
        const list = await getClients();
        const mapped = (list as ApiClient[]).map((c) => ({
          id: c._id as string,
          name: c.name,
        }));
        setClients(mapped);

        // Determine selected client
        const selectedClient = clientIdParam
          ? mapped.find((c) => c.id === clientIdParam)
          : mapped[0];

        // Update active client based on selected client
        if (selectedClient && activeClient?.id !== selectedClient.id) {
          handleClientChange(selectedClient.id, selectedClient.name);
        }
      } catch {
        setClients([]);
      }
    })();
  }, [clientIdParam, isNew, handleClientChange, activeClient?.id]);

  // ---- load one client (skip when new) ----
  useEffect(() => {
    if (isNew || !activeClient?.id) {
      setName('');
      setDob('');
      setGender('');
      setAccessCode('');
      setAvatarUrl('');
      setPhoneNumber('');
      setEmail('');
      setEmergencyContact('');
      setPrimaryCaregiver('');
      setAddress('');
      setDiagnosedDisabilities('');
      setCurrentMedication('');
      setAllergies('');
      setRecentMedicalHistory('');
      setPrimaryHealthContact('');
      setLoading(false);
      setError('');
      return;
    }

    const clientId = activeClient.id;
    let alive = true;

    (async () => {
      try {
        // Fetch client from API
        const client = (await getClientById(clientId)) as ApiClient;
        if (!alive) return;
        if (!client) throw new Error('Client not found');
        // Populate fields from API response
        setName(client.name || '');
        setDob(client.dob || '');
        setGender(client.gender || '');
        setAccessCode(client.accessCode || '');
        setAvatarUrl(client.avatarUrl || '');
        setPhoneNumber(client.phoneNumber || '');
        setEmail(client.email || '');
        setEmergencyContact(client.emergencyContact || '');
        setPrimaryCaregiver(client.primaryCaregiver || '');
        setAddress(client.address || '');

        setDiagnosedDisabilities(
          client.medicalNotes?.diagnosedDisabilities || ''
        );
        setCurrentMedication(client.medicalNotes?.currentMedication || '');
        setAllergies(client.medicalNotes?.allergies || '');
        setRecentMedicalHistory(
          client.medicalNotes?.recentMedicalHistory || ''
        );
        setPrimaryHealthContact(
          client.medicalNotes?.primaryHealthContact || ''
        );
      } catch {
        if (alive) setError('Failed to load client data.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeClient, isNew]);

  // ---- save client ----
  const saveClient = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        dob,
        gender,
        accessCode,
        avatarUrl,
        medicalNotes: {
          diagnosedDisabilities,
          currentMedication,
          allergies,
          recentMedicalHistory,
          primaryHealthContact,
        },
        phoneNumber,
        email,
        emergencyContact,
        primaryCaregiver,
        address,
      };

      // Either create new entry or update current entry
      const url = isNew
        ? '/api/v1/clients'
        : `/api/v1/clients/${activeClient.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save client');
      }

      // Navigate back to appropriate list page
      router.push(backHref);
    } catch (err) {
      console.error(err);
      setError(
        'Failed to save client. Please check your inputs and try again.'
      );
    }
  };

  const onCancel = () => {
    router.push(backHref);
  };

  const onSave = saveClient;

  if (loading) {
    return (
      <DashboardChrome
        page="profile"
        clients={clients}
        onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
        colors={{
          header: colors.header,
          banner: colors.banner,
          text: colors.text,
        }}
      >
        <div
          className="flex-1 flex items-center justify-center"
          style={{ backgroundColor: colors.pageBg2 }}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Loading client profile…
          </h2>
        </div>
      </DashboardChrome>
    );
  }
  if (error) {
    return (
      <DashboardChrome
        page="profile"
        clients={clients}
        onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
        colors={{
          header: colors.header,
          banner: colors.banner,
          text: colors.text,
        }}
      >
        <div
          className="flex-1 flex items-center justify-center"
          style={{ backgroundColor: colors.pageBg, color: 'red' }}
        >
          {error}
        </div>
      </DashboardChrome>
    );
  }

  const pageTitle = isNew
    ? 'Add New Client'
    : `${activeClient?.name || 'Client'}’s Profile`;

  return (
    <DashboardChrome
      page="profile"
      clients={clients}
      onClientChange={(id) => {
        const selected = clients.find((c) => c.id === id);
        if (selected && activeClient?.id !== selected.id) {
          handleClientChange(selected.id, selected.name);
          router.push(`/client_profile?id=${id}`);
        }
      }}
      colors={{
        header: colors.header,
        banner: colors.banner,
        text: colors.text,
      }}
      hideBanner={isNew} // no pink banner with selected client when creating new client profile
    >
      {isNew && <div className="py-4" />}

      <div
        className="w-full min-h-screen flex justify-center"
        style={{ backgroundColor: colors.pageBg }}
      >
        <div className="w-full rounded-xl bg-[#f6efe2]">
          {/* Section bar */}
          <div
            className="w-full px-6 py-4 text-white text-2xl md:text-3xl font-extrabold flex items-center justify-between"
            style={{ backgroundColor: colors.header }}
          >
            <div>{pageTitle}</div>

            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-2 text-base md:text-lg font-semibold bg-white/10 px-4 py-1.5 rounded hover:bg-white/20 transition"
              aria-label="Back"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
              Back
            </button>
          </div>

          {error && <div className="text-red-600 text-lg mb-4">{error}</div>}

          {/* Content: two columns*/}
          <form
            onSubmit={(e) => {
              e.preventDefault(); // prevent full page reload
              saveClient();
            }}
          >
            <div
              className={`w-full mx-auto px-3 ${
                isManagement ? 'pt-3 pb-3' : 'pt-3 pb-3'
              } flex-none`}
            >
              <div className="flex flex-wrap gap-12 px-6 py-6">
                {/* Column 1: avatar */}
                <div className="flex-[0.6] flex flex-col items-center gap-6">
                  <div
                    className="rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                      width: 200,
                      height: 200,
                      border: `1px solid ${colors.header}`,
                      backgroundColor: '#fff',
                    }}
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile avatar"
                        width={100}
                        height={100}
                        className="object-cover rounded-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <User
                          size={150}
                          strokeWidth={0.3}
                          fill={colors.header}
                          color={colors.header}
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload only for family */}
                  {isFamily && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex justify-center">
                        <button
                          onClick={openFilePicker}
                          className="rounded-xl px-4 py-2 text-lg font-bold text-white hover:opacity-90"
                          style={{
                            background:
                              'linear-gradient(90deg, #F9C9B1 0%, #FAEBDC 100%)',
                            color: '#3A0000',
                            border: '1px solid #B47A64',
                            boxShadow: '0 2px 6px rgba(250, 235, 220, 0.6)',
                          }}
                        >
                          Upload photo
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Column 2: Client Info */}
                <div className="flex-[2.8] flex flex-col gap-4 rounded-xl">
                  {/* Personal Information */}
                  <AccordionSection title="Personal Information">
                    <TextInput
                      label="Full Name"
                      value={name}
                      onChange={setName}
                      required
                      readOnly={!isFamily}
                    />
                    <TextInput
                      label="Date of Birth"
                      value={dob}
                      onChange={setDob}
                      readOnly={!isFamily}
                      required
                    />
                    <SelectInput
                      label="Gender"
                      value={gender}
                      onChange={setGender}
                      required
                      readOnly={!isFamily}
                      options={[
                        { label: 'Select gender', value: '' },
                        { label: 'Male', value: 'Male' },
                        { label: 'Female', value: 'Female' },
                        {
                          label: 'Prefer not to say',
                          value: 'Prefer not to say',
                        },
                      ]}
                    />

                    <TextInput
                      label="Access Code"
                      value={accessCode}
                      onChange={setAccessCode}
                      required
                      readOnly={!isFamily}
                    />
                    <div className="text-[15px] mt-2 text-black/80">
                      Don’t have an access code?{' '}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setShowAccessCodeDrawer(true)}
                      >
                        Create one here
                      </button>
                    </div>
                  </AccordionSection>

                  {/* Contact Details */}
                  <AccordionSection title="Contact Details">
                    <TextInput
                      label="Phone Number"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      required
                      readOnly={!isFamily}
                    />
                    <TextInput
                      label="Email"
                      value={email}
                      onChange={setEmail}
                      required
                      readOnly={!isFamily}
                    />
                    <TextInput
                      label="Address"
                      value={address}
                      onChange={setAddress}
                      required
                      readOnly={!isFamily}
                    />
                    <TextInput
                      label="Emergency Contact"
                      value={emergencyContact}
                      onChange={setEmergencyContact}
                      required
                      readOnly={!isFamily}
                    />
                    <TextInput
                      label="Primary Caregiver/Legal Guardian"
                      value={primaryCaregiver}
                      onChange={setPrimaryCaregiver}
                      required
                      readOnly={!isFamily}
                    />
                  </AccordionSection>

                  {/* Health and Medical History */}
                  <AccordionSection title="Health and Medical History">
                    <TextAreaInput
                      label="Diagnosed Disabilities"
                      value={diagnosedDisabilities}
                      onChange={setDiagnosedDisabilities}
                      readOnly={!isFamily}
                    />
                    <TextAreaInput
                      label="Current Medication"
                      value={currentMedication}
                      onChange={setCurrentMedication}
                      readOnly={!isFamily}
                    />
                    <TextAreaInput
                      label="Allergies"
                      value={allergies}
                      onChange={setAllergies}
                      readOnly={!isFamily}
                    />
                    <TextAreaInput
                      label="Recent Medical History"
                      value={recentMedicalHistory}
                      onChange={setRecentMedicalHistory}
                      readOnly={!isFamily}
                    />
                    <TextAreaInput
                      label="Primary Healthcare Provider Contact"
                      value={primaryHealthContact}
                      onChange={setPrimaryHealthContact}
                      readOnly={!isFamily}
                    />
                  </AccordionSection>
                </div>
                {/* Footer buttons: hidden for management.
           NOTE: no bottom padding, no big top margin; stays close to content. */}
                {!isManagement && (
                  <div className="w-full flex justify-end px-8 py-2 gap-4">
                    <button
                      onClick={onCancel}
                      className="rounded-xl px-4 py-2 text-lg font-bold text-white bg-[#3A0000]/80 hover:opacity-50 w-auto"
                      style={{
                        background:
                          'linear-gradient(90deg, #3A0000 0%, #5C1A1A 100%)',
                        boxShadow: '0 2px 6px rgba(58, 0, 0, 0.25)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSave}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-black"
                      style={{
                        background:
                          'linear-gradient(90deg, #FFA94D 0%, #F9C77D 100%)',
                        border: '1.5px solid #E89B42',
                        boxShadow: '0 2px 6px rgba(250, 180, 90, 0.4)',
                      }}
                    >
                      {isCarer ? 'Save Notes' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Access Code Drawer */}
      {isFamily && (
        <AddAccessCodePanel
          open={showAccessCodeDrawer}
          onClose={() => setShowAccessCodeDrawer(false)}
        />
      )}
    </DashboardChrome>
  );
}

/* ----- Helpers ----- */
function FormRow({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-[220px_1fr] items-center gap-2 mb-3">
      <div className="text-[18px] font-black" style={{ color: '#1b0b07' }}>
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-md overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left text-2xl px-4 py-2 text-white font-bold flex justify-between items-center"
        style={{ backgroundColor: colors.header }}
      >
        {title}
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {open && (
        <div
          className="p-4"
          style={{
            backgroundColor: '#F2E5D2',
            border: '1px solid rgba(58,0,0,0.25)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ----- Stable Input Components ----- */
function TextInput({
  label,
  value,
  onChange,
  required = false,
  readOnly = false,
  minWidth = 250,
  width = 180,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  minWidth?: number;
  width?: number;
}) {
  return (
    <FormRow label={label} required={required}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md bg-white border px-3 text-sm outline-none text-black"
        style={{
          border: '1px solid rgba(58,0,0,0.25)',
          width,
          minWidth,
        }}
        required={required}
        readOnly={readOnly}
      />
    </FormRow>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  readOnly = false,
  minWidth = 250,
  height = 112,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  minWidth?: number;
  height?: number;
}) {
  return (
    <FormRow label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-white border px-3 py-2 text-sm outline-none text-black"
        style={{
          border: '1px solid rgba(58,0,0,0.25)',
          minWidth,
          height,
        }}
        readOnly={readOnly}
      />
    </FormRow>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  required = false,
  readOnly = false,
  width = 180,
  minWidth = 250,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  width?: number;
  minWidth?: number;
  options: { label: string; value: string }[];
}) {
  return (
    <FormRow label={label} required={required}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="h-10 rounded-md bg-white border px-3 text-sm outline-none text-black"
        style={{
          border: '1px solid rgba(58,0,0,0.25)',
          width,
          minWidth,
        }}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormRow>
  );
}

function StaticText({
  value,
  placeholder,
}: {
  value?: string;
  placeholder: string;
}) {
  const shown = (value ?? '').trim();
  return (
    <div className="text-[16px] text-black/80 min-h-12 flex items-center">
      {shown || placeholder}
    </div>
  );
}
