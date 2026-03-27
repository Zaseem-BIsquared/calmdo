import { useForm } from "@tanstack/react-form";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "~/convex/_generated/api";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { PROJECT_NAME_MAX_LENGTH } from "@/shared/schemas/projects";

export function ProjectForm() {
  const { mutateAsync: createProject } = useMutation({
    mutationFn: useConvexMutation(api.projects.mutations.create),
  });

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await createProject({ name: value.name.trim() });
      form.reset();
    },
  });

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <Input
            placeholder="New project name..."
            autoComplete="off"
            required
            maxLength={PROJECT_NAME_MAX_LENGTH}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            className="flex-1 bg-transparent"
          />
        )}
      />
      <Button type="submit" size="sm">
        Create
      </Button>
    </form>
  );
}
