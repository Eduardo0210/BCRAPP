import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput 
} from 'react-native';

const MenuItems = ({ items, onAddItem }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Obtener todas las categorías únicas
  const categories = ['Todos', ...new Set(items.map(item => item.categoria))];
  
  // Filtrar los items según la búsqueda y categoría seleccionada
  const filteredItems = items.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.descripcion && item.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || item.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Renderizar cada ítem del menú
  const renderMenuItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => onAddItem(item)}
    >
      <View>
        <Text style={styles.itemNombre}>{item.nombre}</Text>
        {item.descripcion && (
          <Text style={styles.itemDescripcion}>{item.descripcion}</Text>
        )}
        <Text style={styles.itemCategoria}>{item.categoria}</Text>
      </View>
      <Text style={styles.itemPrecio}>${item.precio.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  // Renderizar botón de categoría
  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category ? styles.categoryButtonSelected : {}
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text 
        style={[
          styles.categoryButtonText,
          selectedCategory === category ? styles.categoryButtonTextSelected : {}
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú del Restaurante</Text>
      
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en el menú..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Filtro por categorías */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => renderCategoryButton(item)}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      {/* Lista de items del menú */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderMenuItem}
          keyExtractor={item => item.id.toString()}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay elementos que coincidan con tu búsqueda
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: '#f8b500',
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#f8b500',
  },
  categoryButtonText: {
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginVertical: 5,
    elevation: 1,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDescripcion: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  itemCategoria: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemPrecio: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MenuItems;