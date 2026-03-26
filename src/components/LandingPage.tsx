import React from 'react';
import { Building2, Users, Bed, ShieldCheck, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onSignup: () => void;
  onSignin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignup, onSignin }) => {
  return (
    <div className="min-h-screen bg-docent-bg font-sans">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-docent-primary/5 to-docent-secondary/5 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-docent-primary/10 rounded-full text-docent-primary font-bold text-sm mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-docent-primary animate-pulse"></span>
              Hospital Management Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">
              Complete Hospital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-docent-primary to-docent-secondary">Management System</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Manage departments, staff, beds, patient workflows, and communication from one secure dashboard built for hospitals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onSignup}
                className="group bg-docent-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 active:scale-95 flex items-center gap-2"
              >
                Create Admin Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onSignin}
                className="px-8 py-4 rounded-xl font-bold text-lg text-slate-600 hover:text-docent-primary hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
              >
                Staff Login
              </button>
            </div>
          </div>
        </div>

        <div className="absolute top-1/4 left-0 w-96 h-96 bg-docent-secondary/10 rounded-full blur-3xl -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-docent-primary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </section>

      <section className="border-y border-slate-100 bg-white/50 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem value="120+" label="Departments Managed" />
            <StatItem value="99.9%" label="Platform Uptime" />
            <StatItem value="24/7" label="Operations Visibility" />
            <StatItem value="15+" label="Core Modules" />
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-docent-bg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
              Tools For Daily Hospital Operations
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything your hospital team needs for administration, coordination, and patient care workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Building2 className="h-8 w-8 text-docent-warning" />}
              title="Administration Control"
              description="Register and manage facilities, service lines, and operational configuration with clear ownership."
              color="warning"
              tags={['Admin', 'Compliance', 'Configuration']}
            />
            <FeatureCard
              icon={<Bed className="h-8 w-8 text-docent-secondary" />}
              title="Bed and Capacity Tracking"
              description="Track ICU, HDU, isolation, and specialty bed availability to support efficient patient placement."
              color="secondary"
              tags={['Capacity', 'Ward View', 'Real-time']}
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-docent-primary" />}
              title="Staff Coordination"
              description="Enable secure communication and role-based workflows across doctors, nurses, and support teams."
              color="primary"
              tags={['Roles', 'Secure', 'Collaboration']}
            />
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 z-0"></div>
        <div className="absolute inset-0 bg-docent-primary/20 mix-blend-overlay z-0"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-full mb-8">
            <ShieldCheck className="w-12 h-12 text-docent-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Run your hospital on one platform</h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Start with department onboarding, staff management, and hospital operations dashboards in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onSignup}
              className="bg-docent-primary text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-green-500 transition-all shadow-xl shadow-green-900/50"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatItem = ({ value, label }: { value: string, label: string }) => (
  <div>
    <div className="text-4xl font-bold text-slate-900 mb-1">{value}</div>
    <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, description, color, tags }: { icon: React.ReactNode, title: string, description: string, color: 'primary' | 'secondary' | 'warning', tags: string[] }) => {
  const colorClass = color === 'primary'
    ? 'bg-docent-primary/10'
    : color === 'secondary'
      ? 'bg-docent-secondary/10'
      : 'bg-docent-warning/10';

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${colorClass}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-600 mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
