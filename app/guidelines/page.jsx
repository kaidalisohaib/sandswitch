"use client";

export default function CommunityGuidelinesPage() {
  const guidelines = [
    {
      title: "Educational Purpose",
      description: "This platform is a student project created for educational purposes at CEGEP John Abbott. While the features are functional, please understand that this is a prototype demonstrating the concept of service exchange.",
      icon: "🎓"
    },
    {
      title: "Respectful Interaction",
      description: "When testing or exploring the platform, please maintain a respectful and professional demeanor. This helps demonstrate how a real community platform would function.",
      icon: "🤝"
    },
    {
      title: "Test Data Guidelines",
      description: "When creating test accounts or sample services, please use appropriate and realistic content. This helps showcase the platform's potential in a meaningful way.",
      icon: "📝"
    },
    {
      title: "Feedback Welcome",
      description: "As this is a student project, constructive feedback is highly appreciated. Your insights can help improve the project and demonstrate areas for enhancement.",
      icon: "💭"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Community Guidelines
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Guidelines for interacting with this student project
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {guidelines.map((guideline, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <div className="text-4xl mb-4">{guideline.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {guideline.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {guideline.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            About This Project
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            SandSwitch is a student project conceptualized by Valentina Perez Rojas at CEGEP John Abbott, 
            with website development by Sohaib Kaidali. The platform demonstrates the concept of a 
            service exchange community within an educational context.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            For questions about the project concept or feedback, please contact Valentina Perez Rojas.
          </p>
        </div>
      </div>
    </div>
  );
} 