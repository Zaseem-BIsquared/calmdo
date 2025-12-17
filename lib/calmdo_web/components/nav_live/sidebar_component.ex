defmodule CalmdoWeb.NavLive.SidebarComponent do
  use CalmdoWeb, :live_component
  alias Calmdo.Work
  alias AshPhoenix.Form

  def update(assigns, socket) do
    projects = Work.read_projects!()
    form = Work.form_to_create_project()

    socket =
      socket
      |> assign(assigns)
      |> assign(form: to_form(form))
      |> assign(show_modal: false)
      |> assign(projects: projects)

    {:ok, socket}
  end

  def handle_event("show_modal", _, socket) do
    {:noreply, assign(socket, show_modal: true)}
  end

  def handle_event("hide_modal", _, socket) do
    {:noreply, assign(socket, show_modal: false)}
  end

  def handle_event("validate", %{"form" => form_params}, socket) do
    socket =
      socket
      |> update(:form, fn form ->
        Form.validate(form, form_params)
      end)

    {:noreply, socket}
  end

  def handle_event("save", %{"form" => form_params}, socket) do
    case Form.submit(socket.assigns.form, params: form_params) do
      {:ok, _project} ->
        socket =
          socket
          |> put_flash(:info, "Project created successfully.")
          |> push_navigate(to: ~p"/")

        IO.inspect("test")
        {:noreply, socket}

      {:error, form} ->
        socket =
          socket
          |> put_flash(:error, "Could not create project.")
          |> assign(:form, form)

        {:noreply, socket}
    end
  end
end
