import DupeSubmissionChat from '@/components/DupeSubmissionChat';

export default function SubmitDupePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Submit Your Fashion Dupe
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Help our community discover affordable alternatives to their favorite fashion items.
            Share your dupe findings and make fashion more accessible for everyone.
          </p>
        </div>
        
        <DupeSubmissionChat />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your contributions help build our database of fashion alternatives.
            We review all submissions to ensure quality and accuracy.
          </p>
        </div>
      </div>
    </main>
  );
} 