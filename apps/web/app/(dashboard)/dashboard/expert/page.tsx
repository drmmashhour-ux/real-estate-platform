import { ExpertProfileClient } from "./expert-profile-client";

export const dynamic = "force-dynamic";

export default function ExpertProfilePage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Your profile</h1>
      <p className="mt-2 text-sm text-[#B3B3B3]">
        This information appears on the public mortgage page when your account is active.
      </p>
      <ExpertProfileClient />
    </>
  );
}
