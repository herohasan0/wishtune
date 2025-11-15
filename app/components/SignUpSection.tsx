import GoogleSignInButton from './GoogleSignInButton';

interface SignUpSectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onSignIn?: () => void;
}

export default function SignUpSection({
  title = 'Sign in to create more songs.',
  description = 'Sign in to unlock more prompts and keep your creations safe.',
  buttonText = 'Sign in with Google',
  onSignIn,
}: SignUpSectionProps) {
  return (
    <div className="w-full rounded-[32px] border border-[#F4E0D3] bg-white/85 px-8 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] mb-40">
      <p className="text-lg font-semibold text-[#7A5742]">{title}</p>
      <GoogleSignInButton
        onClick={onSignIn}
        className="mt-5 w-full border-[#E5D2C4] bg-white/90 text-[#493225]"
        text={buttonText}
      />
      <p className="mt-3 text-sm text-[#A07D65]">{description}</p>
    </div>
  );
}

