
import ChallengeList from '@/components/challenge-list';

export default function ChallengesDashboardPage() {
  return (
    <div>
       <h1 className="text-3xl font-headline font-bold mb-6 text-foreground">
            Challenges Dashboard
        </h1>
        <ChallengeList />
    </div>
  );
}
