export interface Concept {
  id: string;
  name: string;
  category: 'function' | 'operator' | 'keyword' | 'data-type' | 'method' | 'concept';
  description: string;
  simpleExample: string;
  syntax?: string;
  parameters?: string[];
  relatedConcepts?: string[];
}

export const conceptsDictionary: Record<string, Concept> = {
  // Functions
  'print': {
    id: 'print',
    name: 'print()',
    category: 'function',
    description: 'Displays output to the console. The most basic way to show information to users.',
    simpleExample: 'print("Hello, World!")',
    syntax: 'print(value1, value2, ..., sep=" ", end="\\n")',
    parameters: ['*values', 'sep', 'end', 'file', 'flush'],
    relatedConcepts: ['string', 'console-output']
  },
  
  'input': {
    id: 'input',
    name: 'input()',
    category: 'function',
    description: 'Gets text input from the user. Always returns a string.',
    simpleExample: 'name = input("What\'s your name? ")',
    syntax: 'input(prompt)',
    parameters: ['prompt'],
    relatedConcepts: ['string', 'variables', 'user-interaction']
  },

  'len': {
    id: 'len',
    name: 'len()',
    category: 'function',
    description: 'Returns the number of items in a sequence (string, list, etc.)',
    simpleExample: 'len("hello")  # Returns 5',
    syntax: 'len(sequence)',
    parameters: ['sequence'],
    relatedConcepts: ['string', 'list', 'sequence']
  },

  'range': {
    id: 'range',
    name: 'range()',
    category: 'function',
    description: 'Creates a sequence of numbers, commonly used in loops.',
    simpleExample: 'range(5)  # Creates 0, 1, 2, 3, 4',
    syntax: 'range(start, stop, step)',
    parameters: ['start', 'stop', 'step'],
    relatedConcepts: ['for-loop', 'sequence', 'numbers']
  },

  'int': {
    id: 'int',
    name: 'int()',
    category: 'function',
    description: 'Converts a value to an integer number.',
    simpleExample: 'int("42")  # Returns 42',
    syntax: 'int(value, base=10)',
    parameters: ['value', 'base'],
    relatedConcepts: ['data-types', 'type-conversion', 'numbers']
  },

  'float': {
    id: 'float',
    name: 'float()',
    category: 'function',
    description: 'Converts a value to a floating-point (decimal) number.',
    simpleExample: 'float("3.14")  # Returns 3.14',
    syntax: 'float(value)',
    parameters: ['value'],
    relatedConcepts: ['data-types', 'type-conversion', 'numbers']
  },

  'str': {
    id: 'str',
    name: 'str()',
    category: 'function',
    description: 'Converts a value to a string (text).',
    simpleExample: 'str(42)  # Returns "42"',
    syntax: 'str(value)',
    parameters: ['value'],
    relatedConcepts: ['data-types', 'type-conversion', 'string']
  },

  // Data Types
  'string': {
    id: 'string',
    name: 'String',
    category: 'data-type',
    description: 'Text data surrounded by quotes. Can use single or double quotes.',
    simpleExample: '"Hello World" or \'Hello World\'',
    syntax: '"text" or \'text\'',
    relatedConcepts: ['print', 'input', 'variables']
  },

  'integer': {
    id: 'integer',
    name: 'Integer',
    category: 'data-type',
    description: 'Whole numbers without decimal points (positive, negative, or zero).',
    simpleExample: '42, -17, 0',
    relatedConcepts: ['numbers', 'int', 'math-operators']
  },

  'float-type': {
    id: 'float-type',
    name: 'Float',
    category: 'data-type',
    description: 'Numbers with decimal points (floating-point numbers).',
    simpleExample: '3.14, -2.5, 0.0',
    relatedConcepts: ['numbers', 'float', 'math-operators']
  },

  'boolean': {
    id: 'boolean',
    name: 'Boolean',
    category: 'data-type',
    description: 'True or False values, used for logical operations.',
    simpleExample: 'True, False',
    relatedConcepts: ['if-statement', 'logical-operators', 'conditions']
  },

  'list': {
    id: 'list',
    name: 'List',
    category: 'data-type',
    description: 'Ordered collection of items that can be changed.',
    simpleExample: '[1, 2, 3] or ["a", "b", "c"]',
    syntax: '[item1, item2, item3]',
    relatedConcepts: ['for-loop', 'len', 'indexing']
  },

  // Operators
  'assignment': {
    id: 'assignment',
    name: '= (Assignment)',
    category: 'operator',
    description: 'Assigns a value to a variable. The equals sign stores data.',
    simpleExample: 'name = "Alice"',
    syntax: 'variable = value',
    relatedConcepts: ['variables']
  },

  'math-operators': {
    id: 'math-operators',
    name: 'Math Operators',
    category: 'operator',
    description: 'Basic arithmetic operations: +, -, *, /, //, %, **',
    simpleExample: '5 + 3, 10 - 4, 3 * 2, 8 / 2',
    syntax: 'number1 operator number2',
    relatedConcepts: ['integer', 'float-type', 'numbers']
  },

  'comparison-operators': {
    id: 'comparison-operators',
    name: 'Comparison Operators',
    category: 'operator',
    description: 'Compare values: ==, !=, <, >, <=, >=',
    simpleExample: '5 > 3  # Returns True',
    syntax: 'value1 operator value2',
    relatedConcepts: ['boolean', 'if-statement', 'conditions']
  },

  'logical-operators': {
    id: 'logical-operators',
    name: 'Logical Operators',
    category: 'operator',
    description: 'Combine boolean values: and, or, not',
    simpleExample: 'True and False  # Returns False',
    syntax: 'condition1 and/or condition2',
    relatedConcepts: ['boolean', 'if-statement', 'conditions']
  },

  // Keywords & Control Flow
  'if-statement': {
    id: 'if-statement',
    name: 'if statement',
    category: 'keyword',
    description: 'Executes code only when a condition is True.',
    simpleExample: 'if age >= 18:\n    print("Adult")',
    syntax: 'if condition:\n    code_block',
    relatedConcepts: ['boolean', 'comparison-operators', 'elif', 'else']
  },

  'elif': {
    id: 'elif',
    name: 'elif',
    category: 'keyword',
    description: 'Checks additional conditions if the previous if/elif was False.',
    simpleExample: 'elif score >= 80:\n    print("Good job!")',
    syntax: 'elif condition:\n    code_block',
    relatedConcepts: ['if-statement', 'else', 'conditions']
  },

  'else': {
    id: 'else',
    name: 'else',
    category: 'keyword',
    description: 'Executes when all previous if/elif conditions are False.',
    simpleExample: 'else:\n    print("Default case")',
    syntax: 'else:\n    code_block',
    relatedConcepts: ['if-statement', 'elif', 'conditions']
  },

  'for-loop': {
    id: 'for-loop',
    name: 'for loop',
    category: 'keyword',
    description: 'Repeats code for each item in a sequence.',
    simpleExample: 'for i in range(3):\n    print(i)',
    syntax: 'for variable in sequence:\n    code_block',
    relatedConcepts: ['range', 'list', 'iteration']
  },

  'while-loop': {
    id: 'while-loop',
    name: 'while loop',
    category: 'keyword',
    description: 'Repeats code while a condition remains True.',
    simpleExample: 'while count < 5:\n    count += 1',
    syntax: 'while condition:\n    code_block',
    relatedConcepts: ['boolean', 'conditions', 'iteration']
  },

  // Concepts
  'variables': {
    id: 'variables',
    name: 'Variables',
    category: 'concept',
    description: 'Named storage for data. Like labeled boxes that hold values.',
    simpleExample: 'name = "Alice"\nage = 25',
    relatedConcepts: ['assignment', 'data-types']
  },

  'indentation': {
    id: 'indentation',
    name: 'Indentation',
    category: 'concept',
    description: 'Spaces or tabs at the beginning of lines. Python uses this to group code.',
    simpleExample: 'if True:\n    print("Indented!")',
    relatedConcepts: ['if-statement', 'for-loop', 'code-blocks']
  },

  'f-strings': {
    id: 'f-strings',
    name: 'f-strings',
    category: 'concept',
    description: 'Format strings that embed variables directly in text using f"...".',
    simpleExample: 'name = "Alice"\nf"Hello, {name}!"',
    syntax: 'f"text {variable} more text"',
    relatedConcepts: ['string', 'variables', 'string-formatting']
  },

  'comments': {
    id: 'comments',
    name: 'Comments',
    category: 'concept',
    description: 'Notes in code that Python ignores. Start with # symbol.',
    simpleExample: '# This is a comment\nprint("Hello")  # End-line comment',
    syntax: '# Your comment here',
    relatedConcepts: ['code-documentation']
  },

  'functions': {
    id: 'functions',
    name: 'Functions',
    category: 'concept',
    description: 'Reusable blocks of code that perform specific tasks.',
    simpleExample: 'def greet(name):\n    return f"Hello, {name}!"',
    syntax: 'def function_name(parameters):\n    return result',
    relatedConcepts: ['def', 'return', 'parameters']
  },

  'def': {
    id: 'def',
    name: 'def',
    category: 'keyword',
    description: 'Defines (creates) a new function.',
    simpleExample: 'def say_hello():\n    print("Hello!")',
    syntax: 'def function_name(parameters):\n    code_block',
    relatedConcepts: ['functions', 'return', 'parameters']
  },

  'return': {
    id: 'return',
    name: 'return',
    category: 'keyword',
    description: 'Sends a value back from a function and ends the function.',
    simpleExample: 'def add(a, b):\n    return a + b',
    syntax: 'return value',
    relatedConcepts: ['functions', 'def']
  }
};

export const getConceptsByCategory = (category: Concept['category']) => {
  return Object.values(conceptsDictionary).filter(concept => concept.category === category);
};

export const searchConcepts = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return Object.values(conceptsDictionary).filter(concept => 
    concept.name.toLowerCase().includes(lowerQuery) ||
    concept.description.toLowerCase().includes(lowerQuery)
  );
};