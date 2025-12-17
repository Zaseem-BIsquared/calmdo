defmodule CalmdoWeb.ProjectLive.Index do
  use CalmdoWeb, :live_view
  alias Calmdo.Work

  def mount(_params, _session, socket) do
    form = Work.form_to_create_project()

    socket =
      socket
      |> assign(form: to_form(form))
      |> assign(show_modal: false)

    {:ok, socket}
  end

  def render(assigns) do
    ~H"""
    <Layouts.app {assigns}>
      <h1>Projects</h1>
      <.link class="btn" phx-click="show_modal">Create Project</.link>

      <div class={"modal modal-bottom sm:modal-middle" <> if @show_modal, do: " modal-open", else: ""}>
        <div class="modal-box">
          <h3 class="font-bold text-lg">Create Project</h3>
          <.form for={@form} phx-change="validate" phx-submit="save">
            <.input field={@form[:name]} type="text" label="Name" />
            <div class="modal-action">
              <button type="button" class="btn" phx-click="hide_modal">Cancel</button>
              <.button phx-disable-with="Saving..." variant="primary">Save</.button>
            </div>
          </.form>
        </div>
        <div class="modal-backdrop" phx-click="hide_modal">
          <button>close</button>
        </div>
      </div>
    </Layouts.app>
    """
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
        AshPhoenix.Form.validate(form, form_params)
      end)

    {:noreply, socket}
  end

  def handle_event("save", %{"form" => form_params}, socket) do
    case AshPhoenix.Form.submit(socket.assigns.form, params: form_params) do
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
