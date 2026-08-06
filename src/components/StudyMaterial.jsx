import React, { useState } from 'react';
import { 
  BookOpen, 
  Calculator, 
  Clock, 
  BarChart2, 
  Zap, 
  Search, 
  ChevronRight, 
  CheckCircle, 
  HelpCircle, 
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';

const quantData = [
  {
    id: 'arithmetic',
    title: 'Core Arithmetic',
    icon: Calculator,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    topics: [
      {
        id: 'number-systems',
        name: 'Number Systems & HCF/LCM',
        difficulty: 'Easy',
        concept: 'Covers divisibility rules, remainders, unit digits, and standard properties of highest common factors and least common multiples.',
        formulas: [
          { label: 'HCF & LCM Relationship', formula: 'HCF × LCM = Product of Two Numbers' },
          { label: 'Remainder Theorem', formula: 'Dividend = (Divisor × Quotient) + Remainder' },
          { label: 'Sum of First n Natural Numbers', formula: 'S_n = [n(n + 1)] / 2' }
        ],
        tricks: [
          'Divisibility by 3/9: If sum of all digits is divisible by 3/9.',
          'Divisibility by 11: Difference between sum of odd position digits and even position digits is 0 or divisible by 11.',
          'Unit digit of 2, 3, 7, 8 repeats in cyclicity of 4 powers.'
        ],
        example: {
          question: 'Find the greatest number that divides 43, 91, and 183 leaving the same remainder in each case.',
          solution: 'Required number = HCF of |91 - 43|, |183 - 91|, and |183 - 43|\n= HCF(48, 92, 140) = 4.'
        }
      },
      {
        id: 'percentages',
        name: 'Percentages & Conversions',
        difficulty: 'Easy',
        concept: 'Calculations based on base values, fraction-to-percentage quick conversions, and successive percentage changes.',
        formulas: [
          { label: 'Percentage Increase / Decrease', formula: '% Change = (|New Value - Old Value| / Old Value) × 100' },
          { label: 'Successive Percentage', formula: 'Net % Change = A + B + (A × B / 100)' }
        ],
        tricks: [
          '1/6 = 16.66%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/11 = 9.09%. Memorize these fractions for quick calculations.',
          'If A is x% more than B, then B is [x / (100 + x)] × 100% less than A.'
        ],
        example: {
          question: 'If the price of petrol increases by 25%, by what percentage must a driver reduce consumption to keep expenditure constant?',
          solution: 'Reduction % = [25 / (100 + 25)] × 100 = (25 / 125) × 100 = 20%.'
        }
      },
      {
        id: 'profit-loss',
        name: 'Profit, Loss & Discount',
        difficulty: 'Medium',
        concept: 'Determining profit/loss margins based on Cost Price (CP), Selling Price (SP), and Marked Price (MP).',
        formulas: [
          { label: 'Profit Percentage', formula: 'Profit % = [(SP - CP) / CP] × 100' },
          { label: 'Loss Percentage', formula: 'Loss % = [(CP - SP) / CP] × 100' },
          { label: 'Selling Price with Discount', formula: 'SP = MP × [(100 - Discount %) / 100]' }
        ],
        tricks: [
          'When two items are sold at the same SP, one at x% profit and one at x% loss, there is always an overall loss of (x / 10)² %.',
          'False weights: Gain % = [Error / (True Value - Error)] × 100.'
        ],
        example: {
          question: 'A article marked at ₹800 is sold after two successive discounts of 10% and 5%. What is the final selling price?',
          solution: 'SP = 800 × (90/100) × (95/100) = 800 × 0.9 × 0.95 = ₹684.'
        }
      }
    ]
  },
  {
    id: 'time-motion',
    title: 'Time, Work & Motion',
    icon: Clock,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    topics: [
      {
        id: 'time-work',
        name: 'Time & Work',
        difficulty: 'Medium',
        concept: 'Work efficiency equations, unit-work method, alternate-day working patterns, and group efficiency.',
        formulas: [
          { label: 'Work-Efficiency Formula', formula: 'Total Work = Efficiency × Time' },
          { label: 'Combined Time (A & B)', formula: 'Time = (A × B) / (A + B) days' },
          { label: 'Group Work Equation', formula: '(M1 × D1 × H1) / W1 = (M2 × D2 × H2) / W2' }
        ],
        tricks: [
          'Assume Total Work = LCM of individual times given in the problem to work with integers instead of fractions.',
          'If A is twice as efficient as B, Ratio of Efficiency A:B = 2:1, Ratio of Time taken A:B = 1:2.'
        ],
        example: {
          question: 'A can complete a job in 10 days and B in 15 days. Working together, how many days will they take?',
          solution: 'LCM(10, 15) = 30 units (Total Work).\nA efficiency = 3 units/day, B efficiency = 2 units/day.\nTotal Efficiency = 5 units/day.\nTime = 30 / 5 = 6 days.'
        }
      },
      {
        id: 'speed-distance',
        name: 'Time, Speed & Distance',
        difficulty: 'Medium',
        concept: 'Relative velocity, average speed calculations, trains crossing objects, and boat/stream movement.',
        formulas: [
          { label: 'Unit Conversion', formula: '1 km/h = 5/18 m/s  |  1 m/s = 18/5 km/h' },
          { label: 'Average Speed (Equal Distances)', formula: 'Avg Speed = (2 × S1 × S2) / (S1 + S2)' },
          { label: 'Relative Speed (Same Direction)', formula: 'Speed = |S1 - S2|' },
          { label: 'Relative Speed (Opposite Direction)', formula: 'Speed = S1 + S2' }
        ],
        tricks: [
          'Train crossing a platform/bridge: Total Distance = Length of Train + Length of Platform.',
          'Downstream Speed = Speed of Boat + Speed of Stream; Upstream Speed = Speed of Boat - Speed of Stream.'
        ],
        example: {
          question: 'A train 150m long travels at 54 km/h. How long will it take to cross a pole?',
          solution: 'Speed in m/s = 54 × (5/18) = 15 m/s.\nTime = Distance / Speed = 150 / 15 = 10 seconds.'
        }
      }
    ]
  },
  {
    id: 'modern-math',
    title: 'Modern Math & DI',
    icon: BarChart2,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    topics: [
      {
        id: 'pnc',
        name: 'Permutation & Combination',
        difficulty: 'Hard',
        concept: 'Counting techniques, linear and circular arrangements, selection combinations, and constraint solving.',
        formulas: [
          { label: 'Permutation (Arrangement)', formula: 'nPr = n! / (n - r)!' },
          { label: 'Combination (Selection)', formula: 'nCr = n! / [r! × (n - r)!]' },
          { label: 'Circular Permutations', formula: 'P_circular = (n - 1)!' }
        ],
        tricks: [
          'When items must stay together: Group them into a single super-element, arrange elements, then multiply by internal arrangements.',
          'Handshake Formula: nCr with r = 2 → Total handshakes = [n × (n - 1)] / 2.'
        ],
        example: {
          question: 'In how many ways can 5 people sit around a circular table?',
          solution: 'For circular arrangement of n items, formula is (n - 1)!.\nWays = (5 - 1)! = 4! = 24 ways.'
        }
      },
      {
        id: 'probability',
        name: 'Probability Basics',
        difficulty: 'Hard',
        concept: 'Quantifying uncertainty using sample spaces, coin/dice rolls, card selections, and mutually exclusive events.',
        formulas: [
          { label: 'Classic Probability', formula: 'P(E) = Number of Favorable Outcomes / Total Outcomes' },
          { label: 'Complementary Event', formula: 'P(E\') = 1 - P(E)' },
          { label: 'Or Rule (Mutually Exclusive)', formula: 'P(A or B) = P(A) + P(B)' }
        ],
        tricks: [
          'At least one problem: Calculate 1 - P(None happen). This is usually faster than adding multiple conditions.',
          'Two dice thrown: Total sample space = 36. Most frequent sum is 7 (6 ways).'
        ],
        example: {
          question: 'Two fair dice are rolled. What is the probability of getting a sum equal to 8?',
          solution: 'Sample Space = 36.\nFavorable pairs for sum 8: (2,6), (3,5), (4,4), (5,3), (6,2) → 5 outcomes.\nProbability = 5 / 36.'
        }
      }
    ]
  }
];

export default function StudyMaterial({ onBack }) {
  const [selectedModule, setSelectedModule] = useState(quantData[0].id);
  const [selectedTopicId, setSelectedTopicId] = useState(quantData[0].topics[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormula, setCopiedFormula] = useState(null);
  const [showSolution, setShowSolution] = useState(false);

  // Active module & topic reference
  const currentModule = quantData.find((m) => m.id === selectedModule) || quantData[0];
  const currentTopic = currentModule.topics.find((t) => t.id === selectedTopicId) || currentModule.topics[0];

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedFormula(index);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Top Header Nav */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Quantitative Aptitude Vault
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Essential formulas, shortcuts, and core concepts for placement aptitude rounds
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search topic or formula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Module & Topic Selector */}
        <div className="lg:col-span-4 space-y-6">
          {/* Module Selector Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              Modules
            </span>
            {quantData.map((mod) => {
              const Icon = mod.icon;
              const isActive = selectedModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setSelectedModule(mod.id);
                    setSelectedTopicId(mod.topics[0].id);
                    setShowSolution(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isActive
                      ? `bg-slate-900 ${mod.borderColor} shadow-lg shadow-blue-500/5`
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${mod.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200 text-sm">{mod.title}</h3>
                      <p className="text-xs text-slate-500">{mod.topics.length} core topics</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? mod.color : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Subtopic List for Active Module */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">
              Topics in {currentModule.title}
            </span>
            {currentModule.topics
              .filter(
                (t) =>
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.concept.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((topic) => {
                const isSelected = selectedTopicId === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      setShowSolution(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-sm ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{topic.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        topic.difficulty === 'Easy'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : topic.difficulty === 'Medium'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {topic.difficulty}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right Column: Topic Detail Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Topic Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  {currentModule.title}
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">{currentTopic.name}</h2>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full border font-medium ${
                  currentTopic.difficulty === 'Easy'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : currentTopic.difficulty === 'Medium'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                }`}
              >
                {currentTopic.difficulty} Level
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{currentTopic.concept}</p>
          </div>

          {/* Key Formula Sheet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Key Formula Sheet</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentTopic.formulas.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-slate-700 transition-colors"
                >
                  <div>
                    <span className="text-xs text-slate-500 font-mono block">{item.label}</span>
                    <span className="text-emerald-400 font-mono text-sm md:text-base font-semibold mt-0.5 block">
                      {item.formula}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.formula, idx)}
                    className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors"
                    title="Copy formula"
                  >
                    {copiedFormula === idx ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts & Tricks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Shortcuts & Speed Tips</h3>
            </div>

            <ul className="space-y-2.5">
              {currentTopic.tricks.map((trick, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-blue-400 font-bold mt-0.5">•</span>
                  <span>{trick}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Sample Practice Question */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">Sample Exam Problem</h3>
            </div>

            <p className="text-slate-200 font-medium text-sm leading-relaxed">
              {currentTopic.example.question}
            </p>

            <div>
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold underline transition-colors"
              >
                {showSolution ? 'Hide Solution' : 'View Step-by-Step Solution'}
              </button>

              {showSolution && (
                <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs md:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {currentTopic.example.solution}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}