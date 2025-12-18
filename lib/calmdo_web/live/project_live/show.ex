defmodule CalmdoWeb.ProjectLive.Show do
  require Logger
  use CalmdoWeb, :live_view

  import CalmdoWeb.Components.Modal, only: [show_modal: 1]

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    project = Calmdo.Work.get_project_by_id!(id)

    socket =
      socket
      |> assign(project: project)

    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app {assigns}>
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-bold">{@project.name}</h1>
        <div class="flex-none space-x-2">
          <.link phx-click={show_modal("project-form")} class="btn btn-soft btn-warning">
            <.icon name="hero-pencil-square" />
            <span class="sr-only">Edit</span>
          </.link>
          <.link
            phx-click="destroy-project"
            data-confirm={"Are you sure you want to delete '#{@project.name}'?"}
            class="btn btn-soft btn-error"
          >
            <.icon name="hero-trash" />
            <span class="sr-only">Delete</span>
          </.link>
        </div>
      </div>

      <%!-- Update form  --%>
      <.live_component
        module={CalmdoWeb.ProjectLive.FormComponent}
        id="project-form"
        action={:update}
        project={@project}
      />
    </Layouts.app>
    """
  end

  @impl true
  def handle_event("destroy-project", _params, socket) do
    project = socket.assigns.project

    case Calmdo.Work.destroy_project!(project) do
      :ok ->
        socket =
          socket
          |> put_flash(:info, "Project deleted successfully")
          |> push_navigate(to: ~p"/")

        {:noreply, socket}

      {:error, error} ->
        Logger.log(
          :error,
          "Could not delete project #{socket.assigns.project.id}: #{inspect(error)}"
        )

        socket =
          socket
          |> put_flash(:error, "Could not delete project")

        {:noreply, socket}
    end
  end
end
