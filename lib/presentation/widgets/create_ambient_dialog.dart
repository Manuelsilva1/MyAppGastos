import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart'; // Assuming flutter_colorpicker is added
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:gestor_de_gastos/models/ambient.dart';
import 'package:gestor_de_gastos/presentation/state/ambient_state.dart';
import 'package:uuid/uuid.dart'; // Import uuid

const uuid = Uuid();

class CreateAmbientDialog extends ConsumerStatefulWidget {
  const CreateAmbientDialog({super.key});

  @override
  _CreateAmbientDialogState createState() => _CreateAmbientDialogState();
}

class _CreateAmbientDialogState extends ConsumerState<CreateAmbientDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  String _currencyCode = 'USD'; // Default currency
  Color _selectedColor = Colors.deepPurple; // Default color

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final newAmbient = Ambient(
        id: uuid.v4(),
        name: _nameController.text,
        color: _selectedColor.value, // Store color as integer
        currencyCode: _currencyCode,
        createdAt: DateTime.now().millisecondsSinceEpoch,
        updatedAt: DateTime.now().millisecondsSinceEpoch,
      );

      ref.read(ambientProvider.notifier).createAmbient(newAmbient);
      Navigator.of(context).pop(); // Close the dialog
    }
  }

  void _pickColor() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context)!.selectColor), // TODO: Localize
        content: SingleChildScrollView(
          child: BlockPicker(
            pickerColor: _selectedColor,
            onColorChanged: (color) {
              setState(() {
                _selectedColor = color;
              });
            },
          ),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: Text(AppLocalizations.of(context)!.select), // TODO: Localize
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!; // Access localizations

    return AlertDialog(
      title: Text(localizations.createNewAmbientButtonTooltip), // Use localized title
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(labelText: localizations.ambientNameLabel), // Use localized label
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return localizations.ambientNameRequiredError; // TODO: Localize validation error
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              // TODO: Implement currency selection (dropdown or similar)
              TextFormField(
                initialValue: _currencyCode,
                decoration: InputDecoration(labelText: localizations.ambientCurrencyLabel), // Use localized label
                onChanged: (value) {
                   _currencyCode = value;
                },
                 validator: (value) {
                  if (value == null || value.isEmpty) {
                    return localizations.ambientCurrencyRequiredError; // TODO: Localize validation error
                  }
                   // TODO: Add currency code validation
                  return null;
                },
              ),+
               const SizedBox(height: 16),
              ListTile(
                title: Text(localizations.ambientColorLabel), // TODO: Localize
                trailing: CircleAvatar(backgroundColor: _selectedColor),
                onTap: _pickColor,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: Text(localizations.cancelButtonText), // TODO: Localize cancel button
        ),
        ElevatedButton(
          onPressed: _submitForm,
          child: Text(localizations.createNewAmbientButtonTooltip), // Use localized button text
        ),
      ],
    );
  }
}
