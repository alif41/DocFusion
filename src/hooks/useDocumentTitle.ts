import { useEffect } from 'react';

export function useDocumentTitle(title: string, prevailOnUnmount: boolean = false) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | DocFusion` : 'DocFusion | Modern All-in-One Document Platform';

    return () => {
      if (!prevailOnUnmount) {
        document.title = previousTitle;
      }
    };
  }, [title, prevailOnUnmount]);
}
