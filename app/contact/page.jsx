"use client";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Contact
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Get in touch about this student project
          </p>
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center">
              <img
                className="mx-auto h-24 w-24 rounded-full"
                src="/profile-placeholder.png"
                alt="Valentina Perez Rojas"
              />
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Valentina Perez Rojas
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Project Owner - CEGEP John Abbott
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  About This Project
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  SandSwitch is a student project conceptualized by Valentina Perez Rojas 
                  at CEGEP John Abbott, demonstrating the concept of a service exchange 
                  platform within an educational community.
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Project Credits
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Project Owner: Valentina Perez Rojas<br />
                  Website Development: Sohaib Kaidali
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Contact Information
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  For questions about the project concept and feedback, please contact 
                  Valentina during project presentation sessions at CEGEP John Abbott.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
