import Button from './Button';

interface ErrorAlertProps {
  title: string;
  message: string;
  retry?: () => void;
}

export function ErrorAlert({ title, message, retry }: ErrorAlertProps) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">{title}: </strong>
      <span className="block sm:inline">{message}</span>
      {retry && (
        <Button 
          onClick={retry} 
          variant="text"
          size="sm"
          className="underline ml-2 text-red-700 hover:text-red-800"
        >
          再試行
        </Button>
      )}
    </div>
  );
}
