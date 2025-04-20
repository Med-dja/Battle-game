import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center text-black">
      <h1 className="text-4xl font-bold mb-6">Bienvenue sur Bataille Navale</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Affrontez d'autres joueurs dans des parties stratégiques de Bataille Navale en ligne.
        Placez vos navires, tirez sur l'adversaire et remportez la victoire !
      </p>
      <div className="flex gap-4">
        <Link 
          href="/register" 
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
        >
          S'inscrire
        </Link>
        <Link 
          href="/login" 
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-medium hover:bg-gray-300 transition"
        >
          Se connecter
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Mode multijoueur</h3>
          <p>Affrontez des joueurs du monde entier dans des parties en temps réel.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Classements</h3>
          <p>Grimpe dans les classements et deviens le meilleur stratège naval.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Évènements spéciaux</h3>
          <p>Participe à des tournois et des défis pour gagner des récompenses.</p>
        </div>
      </div>
    </div>
  );
}
