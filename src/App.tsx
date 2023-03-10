/* eslint-disable jsx-a11y/control-has-associated-label */
import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { AuthContext } from './components/Auth/AuthContext';
import { Todo } from './types/Todo';
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from './api/todos';
import { ErrorOccured } from './components/ErrorOccured/ErrorOccured';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { TodoList } from './components/TodoList/TodoList';
import { FilterStatus } from './types/FilterStatus';
import { getCompletedTodoIds } from './helpers/helpers';
import { ErrorMessages } from './types/ErrorMessages';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredStatus, setFilteredStatus] = useState(FilterStatus.ALL);
  const [isError, setIsError] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingTodos, setDeletingTodos] = useState<number[]>([]);
  const [updatingTodos] = useState<number[]>([]);

  const showError = (text: string) => {
    setIsError(text);
    setTimeout(() => {
      setIsError('');
    }, 2000);
  };

  const onAddTodo = useCallback(async (fieldsForCreate: Omit<Todo, 'id'>) => {
    try {
      setIsAddingTodo(true);
      setTempTodo({
        ...fieldsForCreate,
        id: 0,
      });

      const newTodo = await createTodo(fieldsForCreate);

      setTodos(prev => [...prev, newTodo]);
    } catch (error) {
      showError(ErrorMessages.ADD);

      throw Error('Error while adding todo');
    } finally {
      setTempTodo(null);
      setIsAddingTodo(false);
    }
  }, [showError]);

  const deleteTodoId = useCallback(async (todoId: number) => {
    try {
      setDeletingTodos(prev => [...prev, todoId]);

      await deleteTodo(todoId);

      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch {
      showError(ErrorMessages.DELETE);
    } finally {
      setDeletingTodos(prev => prev.filter(id => id !== todoId));
    }
  }, [showError]);

  const onUpdateTodo = useCallback(async (
    changedTodo: Todo,
  ) => {
    try {
      const { id, title, completed } = changedTodo;
      const updatedTodo = await updateTodo(id, { title, completed });

      setTodos(prevTodos => prevTodos.map(todo => {
        if (todo.id !== id) {
          return todo;
        }

        return updatedTodo;
      }));
    } catch {
      showError(ErrorMessages.UPDATE);
    }
  }, [showError]);

  const deleteCompletedTodos = useCallback(async () => {
    const completedTodoIds = getCompletedTodoIds(todos);

    completedTodoIds.forEach(id => deleteTodoId(id));
  }, [deleteTodoId, todos]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = useContext(AuthContext);
  const newTodoField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // focus the element with `ref={newTodoField}`
    if (newTodoField.current) {
      newTodoField.current.focus();
    }

    if (user) {
      getTodos(user.id)
        .then(setTodos)
        .catch(() => setIsError('Something went wrong...'));
    }
  }, [todos.length]);

  const filteredTodos = useMemo(() => {
    switch (filteredStatus) {
      case FilterStatus.COMPLETED: {
        return todos.filter(todo => (
          todo.completed
        ));
      }

      case FilterStatus.ACTIVE: {
        return todos.filter(todo => (
          !todo.completed
        ));
      }

      default:
        return todos;
    }
  }, [todos, filteredStatus]);

  const activeTodoQuantity = useMemo(() => (
    todos.filter(todo => !todo.completed).length
  ), [todos]);

  const completedTodoQuantity = useMemo(() => (
    todos.filter(todo => todo.completed).length
  ), [todos]);

  const shouldRenderContent = todos.length > 0 || !!tempTodo;

  const isAllTodosCompleted = todos.length === completedTodoQuantity;

  const handleToggleTodosStatus = useCallback(() => {
    const wantedTodoStatus = !isAllTodosCompleted;

    todos.forEach(async (todo) => {
      if (todo.completed !== wantedTodoStatus) {
        await onUpdateTodo(
          { ...todo, completed: wantedTodoStatus },
        );
      }
    });
  }, [isAllTodosCompleted, todos]);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          onAddTodo={onAddTodo}
          isAddingTodo={isAddingTodo}
          showError={showError}
          newTodoField={newTodoField}
          shouldRenderActiveToggle={isAllTodosCompleted}
          handleToggleTodosStatus={handleToggleTodosStatus}
        />

        {shouldRenderContent && (
          <>
            <TodoList
              todos={filteredTodos}
              tempTodo={tempTodo}
              deleteTodoId={deleteTodoId}
              deletingTodos={deletingTodos}
              onUpdateTodo={onUpdateTodo}
              updatingTodos={updatingTodos}
            />

            <Footer
              activeTodoQuantity={activeTodoQuantity}
              filterType={filteredStatus}
              setFilteredStatus={setFilteredStatus}
              deleteCompletedTodos={deleteCompletedTodos}
            />
          </>
        )}
      </div>
      {isError && (
        <ErrorOccured
          error={isError}
          setIsError={setIsError}
        />
      )}
    </div>
  );
};
