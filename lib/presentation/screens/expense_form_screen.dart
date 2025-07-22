import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For input formatters
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:gestor_de_gastos/models/expense.dart';
import 'package:gestor_de_gastos/presentation/state/expense_state.dart';
import 'package:uuid/uuid.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:image_picker/image_picker.dart'; // Import image_picker
import 'package:intl/intl.dart'; // Import for date formatting

const uuid = Uuid();

class ExpenseFormScreen extends ConsumerStatefulWidget {
  final String ambientId;
  final Expense? expenseToEdit; // Pass expense object for editing

  const ExpenseFormScreen({super.key, required this.ambientId, this.expenseToEdit});

  @override
  _ExpenseFormScreenState createState() => _ExpenseFormScreenState();
}

class _ExpenseFormScreenState extends ConsumerState<ExpenseFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  final _categoryController = TextEditingController(); // For editable category
  final _labelController = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  File? _receiptImage;
  final List<String> _categories = ['Comida', 'Transporte', 'Entretenimiento']; // TODO: Load/save categories dynamically

  @override
  void initState() {
    super.initState();
    if (widget.expenseToEdit != null) {
      // Populate form fields if editing an existing expense
      _descriptionController.text = widget.expenseToEdit!.description;
      _amountController.text = widget.expenseToEdit!.amount.toString();
      _categoryController.text = widget.expenseToEdit!.category;
      _selectedDate = DateTime.fromMillisecondsSinceEpoch(widget.expenseToEdit!.date);
      _labelController.text = widget.expenseToEdit!.label ?? '';
      // TODO: Load receipt image if receiptPath is available
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _amountController.dispose();
    _categoryController.dispose();
    _labelController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000), // TODO: Set appropriate range
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    // TODO: Handle permissions
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: source);
    if (image != null) {
      setState(() {
        _receiptImage = File(image.path);
      });
    }
  }

  void _showCategoryDialog() {
    final localizations = AppLocalizations.of(context)!; // Access localizations
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(localizations.selectCategoryTitle), // TODO: Localize
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Existing Categories
            ..._categories.map((category) => ListTile(
              title: Text(category),
              onTap: () {
                _categoryController.text = category;
                Navigator.of(context).pop();
              },
            )),
            // Add New Category
            ListTile(
              leading: const Icon(Icons.add),
              title: Text(localizations.addNewCategoryButtonText), // TODO: Localize
              onTap: () {
                Navigator.of(context).pop();
                _showAddNewCategoryDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAddNewCategoryDialog() {
    final localizations = AppLocalizations.of(context)!; // Access localizations
    final newCategoryController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(localizations.addNewCategoryButtonText), // TODO: Localize
        content: TextField(
          controller: newCategoryController,
          decoration: InputDecoration(labelText: localizations.categoryNameLabel), // TODO: Localize
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: Text(localizations.cancelButtonText), // TODO: Localize
          ),
          ElevatedButton(
            onPressed: () {
              final newCategory = newCategoryController.text.trim();
              if (newCategory.isNotEmpty && !_categories.contains(newCategory)) {
                setState(() {
                  _categories.add(newCategory);
                  _categoryController.text = newCategory; // Set the new category as selected
                });
              }
              Navigator.of(context).pop();
            },
            child: Text(localizations.addCategoryButtonText), // TODO: Localize
          ),
        ],
      ),
    );
  }


  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final amount = double.tryParse(_amountController.text);
      if (amount == null) {
        // TODO: Show error message for invalid amount
        return;
      }

      final expense = Expense(
        id: widget.expenseToEdit?.id ?? uuid.v4(),
        ambientId: widget.ambientId,
        description: _descriptionController.text.trim(),
        amount: amount,
        category: _categoryController.text.trim(),
        date: _selectedDate.millisecondsSinceEpoch,
        receiptPath: _receiptImage?.path, // Save image path
        label: _labelController.text.trim().isEmpty ? null : _labelController.text.trim(),
        createdAt: widget.expenseToEdit?.createdAt ?? DateTime.now().millisecondsSinceEpoch,
        updatedAt: DateTime.now().millisecondsSinceEpoch,
      );

      if (widget.expenseToEdit == null) {
        ref.read(expenseProvider(widget.ambientId).notifier).createExpense(expense);
      } else {
        ref.read(expenseProvider(widget.ambientId).notifier).updateExpense(expense);
      }

      context.pop(); // Go back after saving
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.expenseToEdit == null ? localizations.newExpenseTitle : localizations.editExpenseTitle),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView( // Use ListView for scrolling
            children: [+
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(labelText: localizations.expenseDescriptionLabel),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return localizations.expenseDescriptionRequiredError; // TODO: Localize validation error
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: InputDecoration(labelText: localizations.expenseAmountLabel),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^d*\.?\d*'))], // Allow only numbers and decimal point
                 validator: (value) {
                  if (value == null || value.isEmpty) {
                    return localizations.expenseAmountRequiredError; // TODO: Localize validation error
                  }
                   if (double.tryParse(value) == null) {
                     return localizations.expenseAmountInvalidError; // TODO: Localize validation error
                   }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _categoryController,
                 decoration: InputDecoration(
                   labelText: localizations.expenseCategoryLabel,
                   suffixIcon: IconButton(
                     icon: const Icon(Icons.arrow_drop_down),
                     onPressed: _showCategoryDialog,
                   ),
                 ),
                 readOnly: true, // Make the text field read-only
                 validator: (value) {
                  if (value == null || value.isEmpty) {
                    return localizations.expenseCategoryRequiredError; // TODO: Localize validation error
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.calendar_today),
                title: Text('${localizations.expenseDateLabel}: ${DateFormat.yMd().format(_selectedDate)}'), // TODO: Use ambient locale
                onTap: () => _selectDate(context),
              ),
              const SizedBox(height: 16),
               TextFormField(
                controller: _labelController,
                decoration: InputDecoration(labelText: localizations.expenseLabelLabel),
              ),
              const SizedBox(height: 16),
              // Image Picker
              _receiptImage == null
                  ? ElevatedButton.icon(
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          builder: (context) => SafeArea(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: <Widget>[
                                ListTile(
                                  leading: const Icon(Icons.camera_alt),
                                  title: Text(localizations.camera), // TODO: Localize
                                  onTap: () {
                                    _pickImage(ImageSource.camera);
                                    Navigator.of(context).pop();
                                  },
                                ),
                                ListTile(
                                  leading: const Icon(Icons.photo_library),
                                  title: Text(localizations.gallery), // TODO: Localize
                                  onTap: () {
                                    _pickImage(ImageSource.gallery);
                                    Navigator.of(context).pop();
                                  },
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.camera_alt),
                      label: Text(localizations.addReceiptImageButtonText), // TODO: Localize
                    )
                  : Stack(
                      alignment: Alignment.topRight,
                      children: [
                        Image.file(_receiptImage!, height: 150), // Display the selected image
                        IconButton(
                          icon: const Icon(Icons.remove_circle),
                          onPressed: () {
                            setState(() {
                              _receiptImage = null; // Remove the image
                            });
                          },
                           color: Colors.red,
                        ),
                      ],
                    ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _submitForm,
                child: Text(localizations.saveExpenseButtonText),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
