defmodule CalmdoWeb.ProjectLive.Show do
  use CalmdoWeb, :live_view

  def mount(%{"id" => id}, _session, socket) do
    project = Calmdo.Work.get_project_by_id!(id)

    socket =
      socket
      |> assign(project: project)

    {:ok, socket}
  end

  def render(assigns) do
    ~H"""
    <Layouts.app {assigns}>
      <h1>{@project.name}</h1>
    </Layouts.app>
    """
  end
end
