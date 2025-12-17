defmodule CalmdoWeb.NavLive.SidebarComponent do
  use CalmdoWeb, :live_component

  alias Calmdo.Work

  import CalmdoWeb.Components.Modal, only: [show_modal: 1]

  @impl true
  def update(assigns, socket) do
    projects = Work.read_projects!()

    socket =
      socket
      |> assign(assigns)
      |> assign(projects: projects)

    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-bold">Projects</h1>
        <button class="btn btn-sm" phx-click={show_modal("project-create-form")}>Create</button>
      </div>

      <%!-- create form for new project --%>
      <.live_component
        module={CalmdoWeb.ProjectLive.FormComponent}
        id="project-create-form"
        action={:create}
      />

      <ul class="space-y-2">
        <li :for={project <- @projects}>
          <.link
            navigate={~p"/projects/#{project.id}"}
            class="block w-full text-left p-2 rounded-md hover:bg-base-200"
          >
            {project.name}
          </.link>
        </li>
      </ul>
    </div>
    """
  end
end
