defmodule CalmdoWeb.ProjectLive.Show do
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
        <.link phx-click={show_modal("project-form")} class="btn btn-sm">Edit</.link>
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
end
