import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          About SandSwitch
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          A community-driven platform where you can offer services to others in exchange for a delicious sandwich reward.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-12">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Our Mission
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            SandSwitch was created with a simple but powerful mission: to foster
            a more connected and supportive community at CEGEP John Abbott
            through the exchange of services. We believe that everyone has
            something valuable to offer, whether it's academic help, creative
            skills, or other services. In return for your service, you'll receive
            a delicious sandwich as a token of appreciation.
          </p>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our platform enables students to easily find others who can provide
            the help they need, while also giving them the opportunity to share
            their own skills and knowledge. By creating these connections, we're
            building a stronger sense of community and mutual support among
            students.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-6">
            How It Works
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The process is simple:
          </p>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
            <li>Browse available services or create your own service offering</li>
            <li>Connect with others who need your help</li>
            <li>Complete the service as agreed</li>
            <li>Submit proof of completion to receive your sandwich reward</li>
          </ol>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The name "SandSwitch" comes from the unique reward system - after
            completing a service, you'll receive a sandwich as a thank you for
            your contribution to the community. This simple reward represents
            our commitment to fostering a supportive environment where everyone
            can both give and receive help.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-6">
            Our Values
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-indigo-50 dark:bg-gray-700 p-5 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Community
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We believe in the power of human connection and the strength of
                a supportive community.
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-gray-700 p-5 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Inclusivity
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Everyone has something valuable to offer, and everyone deserves
                access to the support they need.
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-gray-700 p-5 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Trust
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We foster a safe environment where users can trust each other
                and the platform.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-6">
            Join Our Community
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Whether you're offering help or seeking it, SandSwitch is here to
            connect you with others in our community. Join us today and be part
            of building a more supportive and connected campus environment.
            Remember, every service you provide brings you one step closer to
            your next delicious sandwich reward!
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Join SandSwitch
            </Link>
            <Link
              href="/services"
              className="inline-flex justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How does the sandwich reward system work?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                After completing a service, you'll need to submit proof of completion
                to Valentina. Once verified, you'll receive a delicious sandwich as
                a thank you for your contribution to the community.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a cost to use SandSwitch?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                No, SandSwitch is completely free to use. The platform operates on
                a reward system where service providers receive sandwiches as tokens
                of appreciation for their contributions.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How can I ensure my safety when meeting someone?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We recommend meeting in public places on campus, letting a
                friend know about your meeting, and using our rating system to
                check a user's reputation. If you ever feel uncomfortable, you
                can report users through our platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
