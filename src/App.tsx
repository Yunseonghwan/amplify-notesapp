import { GraphQLResult } from "@aws-amplify/api-graphql";
import { API } from "aws-amplify";
import { ChangeEvent, useEffect, useReducer } from "react";
import { listTodos } from "./graphql/queries";
import "antd/dist/reset.css";
import { Button, Input, List } from "antd";
import { v4 as uuid } from "uuid";
import {
  createTodo as CreateTodo,
  deleteTodo as DeleteTodo,
  updateTodo as UpdateTodo,
} from "./graphql/mutations";
import { onCreateTodo } from "./graphql/subscriptions";

const CLIENT_ID = uuid();

interface IState {
  notes: [];
  loading: boolean;
  error: boolean;
  form: { name: string; description: string };
}

const initalState: IState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: "", description: "" },
};

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_NOTES":
      return { ...state, notes: action.notes, loading: false };
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "RESET_FORM":
      return { ...state, form: initalState.form };
    case "SET_INPUT":
      return { ...state, form: { ...state.form, [action.name]: action.value } };
    case "ERROR":
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initalState);

  useEffect(() => {
    fetchNotes();
    const subscription = API.graphql({
      query: onCreateTodo,
    }).subscribe({
      next: (noteData: any) => {
        const note = noteData.value.data.onCreateToto;
        if (CLIENT_ID === note.clientId) return;
        dispatch({ type: "ADD_NOTE", note });
      },
    });
    return () => subscription.unSubscribe();
  }, []);

  const fetchNotes = async () => {
    try {
      const notesData: GraphQLResult<any> = await API.graphql({
        query: listTodos,
      });
      dispatch({ type: "SET_NOTES", notes: notesData.data.listTodos.items });
    } catch (err) {
      dispatch({ type: "ERROR" });
    }
  };

  const createNote = async () => {
    const { form } = state;
    if (!form.name || !form.description) {
      return alert("please enter a name and description");
    }
    const note = { ...form, clientId: CLIENT_ID, completed: false, id: uuid() };
    dispatch({ type: "ADD_NOTE", note });
    dispatch({ type: "RESET_FORM" });
    try {
      await API.graphql({
        query: CreateTodo,
        variables: { input: note },
      });
      console.log("successfully create note!");
    } catch (err) {
      console.log("error:", err);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_INPUT", name: e.target.name, value: e.target.value });
  };

  const deleteNote = async ({ id }: any) => {
    const index = state.note.findIndex((n: any) => n.id === id);
    const notes = [
      ...state.notes.slice(0, index),
      ...state.notex.slice(index + 1),
    ];
    dispatch({ type: "SET_NOTES", notes });
    try {
      await API.graphql({
        query: DeleteTodo,
        variables: { input: { id } },
      });
      console.log("successfully deleted note!");
    } catch (err) {
      console.log({ err });
    }
  };

  const updateNote = async (note: any) => {
    const index = state.note.findIndex((n: any) => n.id === note.id);
    const notes = [...state.notes];
    notes[index].completed = !note.completed;
    dispatch({ type: "SET_NOTES", notes });
    try {
      await API.graphql({
        query: UpdateTodo,
        variables: {
          input: { id: note.id, completed: notes[index].completed },
        },
      });
      console.log("note successfully update!");
    } catch (err) {
      console.log("error:", err);
    }
  };

  const renderItem = (item: any) => {
    return (
      <List.Item
        style={{ textAlign: "left" }}
        actions={[
          <p style={{ color: "#1890ff" }} onClick={() => deleteNote(item)}>
            Delete
          </p>,
          <p style={{ color: "#1890ff" }} onClick={() => updateNote(item)}>
            {item.completed ? "completed" : "mark completed"}
          </p>,
        ]}
      >
        <List.Item.Meta title={item.name} description={item.description} />
      </List.Item>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Note Name"
        name="name"
        style={{ marginBottom: "10px" }}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Note description"
        name="description"
        style={{ marginBottom: "10px" }}
      />
      <Button onClick={createNote} type="primary">
        Create Note
      </Button>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
