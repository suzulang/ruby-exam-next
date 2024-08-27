"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle } from "lucide-react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown'

interface Question {
  id: string;
  content: string;
  code?: string;
  options: { content: string; label: string }[];
  correct_answer: string;
}

import { formatText } from '@/lib/formatText';

// 修改后的预处理函数
const processCode = (code: string) => {
  const lines = code.split('\\n');
  return lines.map((line, index) => {
    if (line.startsWith('[') && line.endsWith(']')) {
      return `\n**${line}**\n`;
    }
    if (line.includes('__')) {
      return line.replace(/__(.*?)__/g, '`$1`');
    }
    return line;
  }).join('\n');
};

export default function QuizComponent() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuizData()
  }, [])

  const fetchQuizData = async () => {
    try {
      const response = await fetch('/api/quiz');
      if (!response.ok) {
        throw new Error('Failed to fetch quiz data');
      }
      const data = await response.json();
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      setError('Failed to load quiz data. Please try again later.');
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-2xl font-bold text-gray-700 dark:text-gray-300">Loading quiz...</div>
  }

  if (error) {
    return <div className="text-center text-2xl font-bold text-red-600 dark:text-red-400">{error}</div>
  }

  if (questions.length === 0) {
    return <div className="text-center text-2xl font-bold text-gray-700 dark:text-gray-300">No questions available.</div>
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion || !currentQuestion.options) {
    return <div className="text-center text-2xl font-bold text-gray-700 dark:text-gray-300">No question available.</div>;
  }

  const handleAnswerSelection = (answer: string) => {
    setSelectedAnswer(answer)
    setShowResult(true)
    if (answer === currentQuestion.correct_answer) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    setShowResult(false)
    setSelectedAnswer("")
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer("")
    setScore(0)
    setShowResult(false)
    setQuizCompleted(false)
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">{formatText(currentQuestion.content)}</p>
            {currentQuestion.code && (
              <SyntaxHighlighter
                language="ruby"
                style={tomorrow}
                className="rounded-md text-sm"
                showLineNumbers={true}
                wrapLines={true}
                wrapLongLines={true}
                customStyle={{ whiteSpace: 'pre-wrap' }}
              >
                {processCode(currentQuestion.code)}
              </SyntaxHighlighter>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={resetQuiz} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
            Restart Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-gray-800 dark:text-gray-200">
          <span className="text-2xl font-bold">Question {currentQuestionIndex + 1}/{questions.length}</span>
          <span className="text-lg font-semibold">Score: {score}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    language={match[1]}
                    style={tomorrow}
                    className="rounded-md text-sm"
                    showLineNumbers={true}
                    wrapLines={true}
                    wrapLongLines={true}
                    customStyle={{ whiteSpace: 'pre-wrap' }}
                  >
                    {processCode(String(children).replace(/\n$/, ''))}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {currentQuestion.content}
          </ReactMarkdown>
          {currentQuestion.code && (
            <SyntaxHighlighter
              language="ruby"
              style={tomorrow}
              className="rounded-md text-sm"
              showLineNumbers={true}
              wrapLines={true}
              wrapLongLines={true}
              customStyle={{ whiteSpace: 'pre-wrap' }}
            >
              {processCode(currentQuestion.code)}
            </SyntaxHighlighter>
          )}
        </div>
        <RadioGroup onValueChange={handleAnswerSelection} value={selectedAnswer} className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div key={index} className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
              showResult
                ? option.label === currentQuestion.correct_answer
                  ? "bg-green-100 dark:bg-green-800"
                  : option.label === selectedAnswer
                  ? "bg-red-100 dark:bg-red-800"
                  : "bg-gray-100 dark:bg-gray-700"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}>
              <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer text-gray-700 dark:text-gray-300">
                {String.fromCharCode(65 + index)}. {option.content}
              </Label>
              <RadioGroupItem value={option.label} id={`option-${index}`} disabled={showResult} />
              {showResult && option.label === currentQuestion.correct_answer && (
                <CheckCircle2 className="text-green-500 h-5 w-5" />
              )}
              {showResult && option.label === selectedAnswer && option.label !== currentQuestion.correct_answer && (
                <XCircle className="text-red-500 h-5 w-5" />
              )}
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        <Button 
          onClick={handleNextQuestion} 
          disabled={!showResult} 
          className="mb-4"
        >
          {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
        </Button>
        <Progress value={progress} className="w-full" />
      </CardFooter>
    </Card>
  )
}