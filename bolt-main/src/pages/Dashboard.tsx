import { useMemo } from 'react';
import { Heart, MessageSquare, FileText, TrendingUp, Smile } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Dashboard() {
  const { messages, notes } = useApp();

  const stats = useMemo(() => {
    const emotionCounts: Record<string, number> = {};
    const emotionIntensities: Record<string, number[]> = {};

    [...messages, ...notes].forEach((item) => {
      if (item.emotion) {
        emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
        if (item.emotion_intensity !== null) {
          if (!emotionIntensities[item.emotion]) {
            emotionIntensities[item.emotion] = [];
          }
          emotionIntensities[item.emotion].push(item.emotion_intensity);
        }
      }
    });

    const topEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const avgIntensities = Object.entries(emotionIntensities).map(([emotion, intensities]) => ({
      emotion,
      avg: intensities.reduce((a, b) => a + b, 0) / intensities.length,
    }));

    return {
      totalMessages: messages.length,
      totalNotes: notes.length,
      emotionCounts,
      topEmotions,
      avgIntensities,
    };
  }, [messages, notes]);

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: 'from-yellow-400 to-orange-400',
      calm: 'from-blue-400 to-cyan-400',
      supportive: 'from-green-400 to-emerald-400',
      empathetic: 'from-purple-400 to-pink-400',
      encouraging: 'from-orange-400 to-red-400',
      happy: 'from-yellow-300 to-yellow-500',
      sad: 'from-blue-500 to-blue-700',
      anxious: 'from-purple-500 to-purple-700',
      excited: 'from-pink-400 to-rose-500',
    };
    return colors[emotion] || 'from-gray-400 to-gray-600';
  };

  const getEmotionIcon = (emotion: string) => {
    return <Smile className="w-6 h-6" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emotion Dashboard</h1>
        <p className="text-gray-600">Track your emotional journey and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalMessages}</h3>
          <p className="text-sm text-gray-600">Total Messages</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalNotes}</h3>
          <p className="text-sm text-gray-600">Notes Created</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {Object.keys(stats.emotionCounts).length}
          </h3>
          <p className="text-sm text-gray-600">Emotions Tracked</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <Smile className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {stats.topEmotions[0]?.[0] || 'N/A'}
          </h3>
          <p className="text-sm text-gray-600">Top Emotion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Emotions</h2>
          <div className="space-y-4">
            {stats.topEmotions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No emotions tracked yet</p>
            ) : (
              stats.topEmotions.map(([emotion, count]) => {
                const maxCount = stats.topEmotions[0][1];
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={emotion}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEmotionIcon(emotion)}
                        <span className="font-medium text-gray-700 capitalize">{emotion}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getEmotionColor(emotion)} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Emotion Intensity</h2>
          <div className="space-y-4">
            {stats.avgIntensities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No intensity data available</p>
            ) : (
              stats.avgIntensities
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 5)
                .map(({ emotion, avg }) => (
                  <div key={emotion}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEmotionIcon(emotion)}
                        <span className="font-medium text-gray-700 capitalize">{emotion}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {(avg * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getEmotionColor(emotion)} rounded-full transition-all duration-500`}
                        style={{ width: `${avg * 100}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Emotions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(stats.emotionCounts).length === 0 ? (
            <p className="col-span-full text-gray-500 text-center py-8">
              Start chatting or creating notes to track emotions
            </p>
          ) : (
            Object.entries(stats.emotionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([emotion, count]) => (
                <div
                  key={emotion}
                  className={`bg-gradient-to-br ${getEmotionColor(emotion)} rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getEmotionIcon(emotion)}
                    <span className="font-semibold capitalize">{emotion}</span>
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm opacity-90">occurrences</p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
