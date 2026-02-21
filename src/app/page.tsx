'use client';

import { useState } from 'react';
import TeamsSection from '@/components/TeamsSection';
import ChampionshipsSection from '@/components/ChampionshipsSection';
import SearchSection from '@/components/SearchSection';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search'>('dashboard');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 text-white py-12 shadow-xl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-5xl">🏏</div>
            <h1 className="text-5xl font-bold">Cricket Data Manager</h1>
          </div>
          <p className="text-blue-100 text-lg ml-0">Organize tournaments, manage teams, and track match statistics</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all transform ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all transform ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md'
            }`}
          >
            🔍 Search
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <TeamsSection />
            <ChampionshipsSection />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="animate-fade-in">
            <SearchSection />
          </div>
        )}
      </div>
    </main>
  );
}
