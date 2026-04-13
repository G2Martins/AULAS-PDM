import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';

// Subcomponente para gerenciar o estado individual de cada Meta (se está editando ou não)
function MetaItem({ meta, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(meta.text);

  function handleSave() {
    onEdit(meta.id, editValue); // Salva o novo texto no App.js
    setIsEditing(false);        // Sai do modo de edição
  }

  return (
    <View style={styles.itemContainer}>
      
      {/* Se estiver editando, mostra um Input. Se não, mostra o Texto */}
      {isEditing ? (
        <TextInput
          style={styles.editInput}
          value={editValue}
          onChangeText={setEditValue}
          autoFocus
        />
      ) : (
        <Text style={styles.itemText}>{meta.text}</Text>
      )}

      {/* Botões de Ação */}
      <View style={styles.actions}>
        {isEditing ? (
          <TouchableOpacity onPress={handleSave} style={[styles.actionBtn, styles.saveBtn]}>
            <Text style={styles.actionText}>Salvar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.actionBtn, styles.editBtn]}>
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={() => onDelete(meta.id)} style={[styles.actionBtn, styles.deleteBtn]}>
          <Text style={styles.actionText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MetasList(props) {
  return (
    <View>
      {props.array.map((meta) => (
        <MetaItem 
          key={meta.id} 
          meta={meta} 
          onDelete={props.onDelete} 
          onEdit={props.onEdit} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#5e0acc',
  },
  itemText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 16,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 5,
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: '#3b0680', // Roxo mais escuro
  },
  saveBtn: {
    backgroundColor: '#28a745', // Verde
  },
  deleteBtn: {
    backgroundColor: '#dc3545', // Vermelho
  },
  actionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  }
});