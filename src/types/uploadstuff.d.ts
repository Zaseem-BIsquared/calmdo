// Override @xixixao/uploadstuff types for React 19 compatibility
// The package ships raw .tsx files which use React 18 useRef() API
declare module "@xixixao/uploadstuff/react" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useUploadFiles(
    generateUploadUrl: any,
    options?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onUploadComplete?: (uploaded: { response: any; name: string }[]) => void;
      onUploadError?: (error: unknown) => void;
      onUploadBegin?: (fileName: string) => void;
    },
  ): {
    startUpload: (files: File[]) => Promise<void>;
    isUploading: boolean;
  };
}
