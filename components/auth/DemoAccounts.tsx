'use client';

interface DemoAccount {
  role: string;
  email: string;
  password: string;
}

interface DemoAccountsProps {
  onDemoSelect?: (email: string, password: string) => void;
}

export default function DemoAccounts({ onDemoSelect }: DemoAccountsProps) {
  const accounts: DemoAccount[] = [
    {
      role: 'Admin',
      email: 'admin@hrms.com',
      password: 'admin123',
    },
    {
      role: 'HR',
      email: 'hr@hrms.com',
      password: 'hr123456',
    },
    {
      role: 'Employee',
      email: 'employee@hrms.com',
      password: 'employee@123',
    },
    {
      role: 'Candidate',
      email: 'candidate@hrms.com',
      password: 'candidate123',
    },
  ];

  const handleSelect = (email: string, password: string) => {
    onDemoSelect?.(email, password);
  };

  return (
    <aside className="demo-accounts-floating">
      <p className="demo-accounts-title">Demo Accounts</p>
      <h6>(Click to automatically fill)</h6>

      {accounts.map((account) => (
        <div
          key={account.email}
          className="demo-account-item cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => handleSelect(account.email, account.password)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleSelect(account.email, account.password);
            }
          }}
        >
          <span className="demo-role">{account.role}</span>
          <p className="text-sm">{account.email}</p>
          <p className="text-sm opacity-75">{account.password}</p>
        </div>
      ))}
    </aside>
  );
}