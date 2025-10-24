/**
 * File path: /components/top_menu/AccessDropdown.tsx
 * Front-end Author: Qingyue Zhao
 * Back-end Author: Denise Alexander
 *
 * Purpose: displays all users (family/management/carer) who have access to a client.
 *
 * Last Updated by Denise Alexander (24/10/2025): added phone number as field.
 *
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getUsersWithAccess, type AccessUser } from '@/lib/data';
import { ChevronDown, Mail, User, Phone } from 'lucide-react';

const palette = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC',
};

export default function AccessMenu({ clientId }: { clientId?: string | null }) {
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside the box -> close the dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      if (!clientId) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const data = await getUsersWithAccess(clientId);
        if (mounted) setUsers(data);
      } catch (err) {
        console.error('Failed to load users with access', err);
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  const formatRole = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1);

  // Compute dropdown position relative to button
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>(
    { top: 0, left: 0 }
  );

  const toggleDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="print:hidden">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative z-20 inline-flex items-center px-3 py-1 rounded-xl border border-transparent hover:border-black/50 bg-white font-bold text-lg whitespace-nowrap"
      >
        Users with Client Access
        <ChevronDown className="w-5 h-5 ml-3 text-black" />
      </button>

      {isOpen &&
        createPortal(
          <div
            className="absolute z-50 w-80 rounded-md border border-black/20 bg-white shadow-2xl max-h-80 overflow-y-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            {loading ? (
              <div className="px-5 py-4 text-lg font-semibold">Loading…</div>
            ) : users.length === 0 ? (
              <div className="px-5 py-4 text-lg font-semibold text-black/70">
                No users found
              </div>
            ) : (
              <ul className="py-2">
                {users.map((u, i) => (
                  <li
                    key={u._id ?? `${u.fullName}-${i}`}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-black/5 border-b border-black/10 last:border-none transition"
                  >
                    <User
                      className="w-7 h-7 mt-1 text-black/80 shrink-0"
                      size={45}
                      strokeWidth={0.3}
                      fill={palette.header}
                      color={palette.header}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">
                        {u.fullName}
                      </span>
                      <span className="text-sm text-black/60 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {u.email}
                      </span>
                      <span className="text-sm text-black/60 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {u.phone}
                      </span>
                      <span className="text-sm text-black/60 mt-0.5">
                        {formatRole(u.role)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
